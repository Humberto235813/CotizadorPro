/**
 * seedCrmFromQuotes.ts
 *
 * One-time migration utility that reads existing quotes and companies
 * from Firestore and populates the CRM collections:
 * - contacts: unique clients extracted from quotes (de-duped by email or name+company)
 * - deals: one deal per quote, with stage derived from quote.status
 * - activities: one follow-up activity per open deal
 *
 * Also patches each quote's contactId for future linking.
 */
import { db } from '../firebase';
import {
    collection, getDocs, addDoc, updateDoc, doc, query, orderBy, writeBatch
} from 'firebase/firestore';
import type { Quote, Company, Contact, Deal, DealStage, Activity } from '../types';

interface SeedResult {
    contactsCreated: number;
    dealsCreated: number;
    activitiesCreated: number;
    quotesLinked: number;
}

/**
 * Derive deal stage from quote status
 */
function stagFromStatus(status: string): { stage: DealStage; probability: number } {
    switch (status) {
        case 'sold':
            return { stage: 'closed_won', probability: 100 };
        case 'draft':
            return { stage: 'prospect', probability: 10 };
        case 'created':
        default:
            return { stage: 'quoted', probability: 50 };
    }
}

/**
 * De-duplication key for a client.
 * Prefer email; fall back to name+company lowercased.
 */
function clientKey(name: string, company: string, email: string): string {
    if (email && email.trim()) return email.trim().toLowerCase();
    return `${name.trim().toLowerCase()}|${company.trim().toLowerCase()}`;
}

export async function seedCrmFromQuotes(): Promise<SeedResult> {
    const now = new Date().toISOString();

    // 1. Load quotes
    const qSnap = await getDocs(query(collection(db, 'quotes'), orderBy('date')));
    const quotes: (Quote & { _docId: string })[] = qSnap.docs.map(d => ({
        ...(d.data() as Quote),
        id: d.id,
        _docId: d.id,
    }));

    if (quotes.length === 0) throw new Error('No hay cotizaciones para importar');

    // 2. Load companies (for mapping companyId → name)
    const cSnap = await getDocs(collection(db, 'companies'));
    const companiesMap = new Map<string, Company>();
    cSnap.docs.forEach(d => companiesMap.set(d.id, { ...d.data(), id: d.id } as Company));

    // 3. Check if CRM already seeded (avoid duplicates)
    const existingContacts = await getDocs(collection(db, 'contacts'));
    if (existingContacts.size > 0) {
        throw new Error(`Ya existen ${existingContacts.size} contactos en el CRM. Limpia la colección primero si deseas re-importar.`);
    }

    // 4. Extract unique contacts from quotes
    const contactMap = new Map<string, {
        name: string; company: string; email: string; phone: string; address: string;
        quoteIds: string[];
        totalValue: number;
        hasSold: boolean;
    }>();

    for (const q of quotes) {
        const key = clientKey(q.clientName || '', q.clientCompany || '', q.clientEmail || '');
        if (!key || key === '|') continue; // Skip empty clients

        const existing = contactMap.get(key);
        if (existing) {
            existing.quoteIds.push(q._docId);
            existing.totalValue += q.total || 0;
            if (q.status === 'sold') existing.hasSold = true;
            // Enrich with missing data
            if (!existing.email && q.clientEmail) existing.email = q.clientEmail;
            if (!existing.phone && q.clientPhone) existing.phone = q.clientPhone;
            if (!existing.address && q.clientAddress) existing.address = q.clientAddress;
        } else {
            contactMap.set(key, {
                name: q.clientName || 'Sin nombre',
                company: q.clientCompany || '',
                email: q.clientEmail || '',
                phone: q.clientPhone || '',
                address: q.clientAddress || '',
                quoteIds: [q._docId],
                totalValue: q.total || 0,
                hasSold: q.status === 'sold',
            });
        }
    }

    // 5. Create contacts in Firestore
    const contactIdMap = new Map<string, string>(); // clientKey → Firestore doc ID
    let contactsCreated = 0;

    for (const [key, c] of contactMap) {
        // Determine tags based on behavior
        const tags: string[] = [];
        if (c.hasSold) tags.push('Frecuente');
        if (c.quoteIds.length >= 3) tags.push('VIP');
        if (!c.hasSold && c.quoteIds.length === 1) tags.push('Nuevo');

        const contactData: Omit<Contact, 'id'> = {
            name: c.name,
            company: c.company,
            email: c.email,
            phone: c.phone,
            address: c.address,
            tags,
            source: 'Cotización', // Imported from quotes
            notes: `Importado automáticamente. ${c.quoteIds.length} cotización(es), valor total: $${c.totalValue.toLocaleString('es-MX')}`,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await addDoc(collection(db, 'contacts'), contactData);
        contactIdMap.set(key, docRef.id);
        contactsCreated++;
    }

    // 6. Create deals from quotes and link contacts
    let dealsCreated = 0;
    let activitiesCreated = 0;
    let quotesLinked = 0;

    for (const q of quotes) {
        const key = clientKey(q.clientName || '', q.clientCompany || '', q.clientEmail || '');
        const contactId = contactIdMap.get(key) || '';

        // Link quote to contact
        if (contactId) {
            await updateDoc(doc(db, 'quotes', q._docId), { contactId });
            quotesLinked++;
        }

        // Create a deal for each quote
        const { stage, probability } = stagFromStatus(q.status);
        const companyName = companiesMap.get(q.companyId)?.name || '';

        const dealData: Omit<Deal, 'id'> = {
            contactId,
            companyId: q.companyId || '',
            title: `${q.quoteNumber || 'Cotización'} — ${q.clientCompany || q.clientName || 'Cliente'}`,
            value: q.total || 0,
            stage,
            probability,
            expectedCloseDate: q.date || now,
            quoteIds: [q._docId],
            notes: companyName ? `Empresa: ${companyName}` : '',
            createdAt: q.createdAt || now,
            updatedAt: now,
        };

        const dealRef = await addDoc(collection(db, 'deals'), dealData);
        dealsCreated++;

        // Create follow-up activities for non-closed deals
        if (stage !== 'closed_won' && stage !== 'closed_lost') {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3); // Follow up in 3 days

            const activityData: Omit<Activity, 'id'> = {
                contactId,
                dealId: dealRef.id,
                type: 'follow_up',
                title: `Seguimiento: ${q.quoteNumber || 'Cotización'} — ${q.clientName || 'Cliente'}`,
                description: `Dar seguimiento a la cotización ${q.quoteNumber} por $${(q.total || 0).toLocaleString('es-MX')}`,
                dueDate: futureDate.toISOString().split('T')[0],
                completed: false,
                createdAt: now,
            };

            await addDoc(collection(db, 'activities'), activityData);
            activitiesCreated++;
        }
    }

    return { contactsCreated, dealsCreated, activitiesCreated, quotesLinked };
}
