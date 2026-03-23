import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Company, Quote, Contact, Deal, Activity } from '../../types';
import { db, storage } from '../../firebase';
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const placeholderLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='16' height='20' x='4' y='2' rx='2'/%3E%3Cpath d='M9 22v-4h6v4'/%3E%3Cpath d='M8 6h.01'/%3E%3Cpath d='M16 6h.01'/%3E%3Cpath d='M12 6h.01'/%3E%3Cpath d='M12 10h.01'/%3E%3Cpath d='M12 14h.01'/%3E%3Cpath d='M16 10h.01'/%3E%3Cpath d='M16 14h.01'/%3E%3Cpath d='M8 10h.01'/%3E%3Cpath d='M8 14h.01'/%3E%3C/svg%3E";

/* ──────────────── Types ──────────────── */

interface DataContextType {
  // Data
  companies: Company[];
  quotes: Quote[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  // Company CRUD
  addCompany: (data: Omit<Company, 'id' | 'logo'>, logoFile: File | null) => Promise<void>;
  updateCompany: (id: string, data: Omit<Company, 'id' | 'logo'>, logoFile: File | null) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Quote CRUD
  addQuote: (data: Omit<Quote, 'id'>) => Promise<string>;
  updateQuote: (id: string, data: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  // Contact CRUD
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Deal CRUD
  addDeal: (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDeal: (id: string, data: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;

  // Activity CRUD
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

/* ──────────────── Provider ──────────────── */

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userProfile, isAdmin } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter quotes by company for non-admin users ──
  const quotes = useMemo(() => {
    if (isAdmin || !userProfile?.companyId) return allQuotes;
    return allQuotes.filter(q => q.companyId === userProfile.companyId);
  }, [allQuotes, isAdmin, userProfile?.companyId]);

  // ── Real-time listeners (single source of truth) ──
  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setAllQuotes([]);
      setContacts([]);
      setDeals([]);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loaded = 0;
    const totalCollections = 5;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= totalCollections) setIsLoading(false);
    };

    const handleError = (err: Error) => {
      toast.error(`Error de datos: ${err.message}`);
      setError('Error al cargar datos.');
      setIsLoading(false);
    };

    const unsubs = [
      onSnapshot(
        query(collection(db, 'companies'), orderBy('name')),
        (snap) => { setCompanies(snap.docs.map(d => ({ ...d.data(), id: d.id } as Company))); setError(null); checkLoaded(); },
        handleError
      ),
      onSnapshot(
        query(collection(db, 'quotes'), orderBy('date')),
        (snap) => { setAllQuotes(snap.docs.map(d => ({ ...d.data(), id: d.id } as Quote))); checkLoaded(); },
        handleError
      ),
      onSnapshot(
        query(collection(db, 'contacts'), orderBy('name')),
        (snap) => { setContacts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Contact))); checkLoaded(); },
        handleError
      ),
      onSnapshot(
        query(collection(db, 'deals'), orderBy('createdAt')),
        (snap) => { setDeals(snap.docs.map(d => ({ ...d.data(), id: d.id } as Deal))); checkLoaded(); },
        handleError
      ),
      onSnapshot(
        query(collection(db, 'activities'), orderBy('dueDate')),
        (snap) => { setActivities(snap.docs.map(d => ({ ...d.data(), id: d.id } as Activity))); checkLoaded(); },
        handleError
      ),
    ];

    return () => unsubs.forEach(u => u());
  }, [user]);

  // ── Company CRUD ──
  const addCompany = useCallback(async (data: Omit<Company, 'id' | 'logo'>, logoFile: File | null) => {
    let logoUrl = placeholderLogo;
    if (logoFile) {
      const storageRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, 'companies'), { ...data, logo: logoUrl, createdBy: user?.uid });
    toast.success(`Empresa "${data.name}" creada exitosamente`);
  }, [user]);

  const updateCompany = useCallback(async (id: string, data: Omit<Company, 'id' | 'logo'>, logoFile: File | null) => {
    const updated: Partial<Company> = { ...data };
    if (logoFile) {
      const storageRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      updated.logo = await getDownloadURL(storageRef);
    }
    await updateDoc(doc(db, 'companies', id), updated);
    toast.success(`Empresa "${data.name}" actualizada exitosamente`);
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'companies', id));
    toast.success('Empresa eliminada exitosamente');
  }, []);

  // ── Quote CRUD ──
  const addQuote = useCallback(async (data: Omit<Quote, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'quotes'), { ...data, createdBy: user?.uid });
    toast.success(`Cotización ${data.quoteNumber} creada exitosamente`);
    return docRef.id;
  }, [user]);

  const updateQuote = useCallback(async (id: string, data: Partial<Quote>) => {
    await updateDoc(doc(db, 'quotes', id), data);
  }, []);

  const deleteQuote = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'quotes', id));
  }, []);

  // ── Contact CRUD ──
  const addContact = useCallback(async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await addDoc(collection(db, 'contacts'), { ...data, createdAt: now, updatedAt: now, createdBy: user?.uid });
    toast.success('Contacto creado');
  }, [user]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    await updateDoc(doc(db, 'contacts', id), { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'contacts', id));
    toast.success('Contacto eliminado');
  }, []);

  // ── Deal CRUD ──
  const addDeal = useCallback(async (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await addDoc(collection(db, 'deals'), { ...data, createdAt: now, updatedAt: now, createdBy: user?.uid });
    toast.success('Deal creado');
  }, [user]);

  const updateDeal = useCallback(async (id: string, data: Partial<Deal>) => {
    await updateDoc(doc(db, 'deals', id), { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deleteDeal = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'deals', id));
    toast.success('Deal eliminado');
  }, []);

  // ── Activity CRUD ──
  const addActivity = useCallback(async (data: Omit<Activity, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'activities'), { ...data, createdAt: new Date().toISOString(), createdBy: user?.uid });
    toast.success('Actividad creada');
  }, [user]);

  const updateActivity = useCallback(async (id: string, data: Partial<Activity>) => {
    await updateDoc(doc(db, 'activities', id), data);
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'activities', id));
    toast.success('Actividad eliminada');
  }, []);

  return (
    <DataContext.Provider
      value={{
        companies, quotes, contacts, deals, activities, isLoading, error,
        addCompany, updateCompany, deleteCompany,
        addQuote, updateQuote, deleteQuote,
        addContact, updateContact, deleteContact,
        addDeal, updateDeal, deleteDeal,
        addActivity, updateActivity, deleteActivity,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
