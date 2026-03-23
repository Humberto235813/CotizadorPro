import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FilePlusIcon } from '../components/icons/Icons';
import buildQuoteReportHtml from '../report/buildQuoteReportHtml';
import { Quote, QuoteItem } from '../types';
import CompanyFilter from '../components/CompanyFilter';
import ConfirmModal from '../components/ConfirmModal';
import QuoteFilters from '../components/QuoteFilters';
import DashboardStats from '../components/DashboardStats';
import LoadingSkeleton from '../components/LoadingSkeleton';
import QuotesTable from '../components/QuotesTable';
import QuoteEditModal from '../components/QuoteEditModal';
import { useData } from '../src/contexts/DataContext';
import { formatCurrency } from '../src/utils/format';

const Dashboard: React.FC = () => {
  const { companies, quotes: allQuotes, isLoading, deleteQuote, updateQuote, addQuote } = useData();
  const navigate = useNavigate();
  // ── Core state ──
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const quotes = allQuotes;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // ── Edit modal state ──
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [draft, setDraft] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'created' | 'sold' | 'draft'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Confirm modal ──
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  } | null>(null);



  // ─────────────────────────────────────────────
  // Helpers (formatCurrency imported from utils)
  // ─────────────────────────────────────────────

  // Quotes filtered by company only (for DashboardStats)
  const companyQuotes = useMemo(() => {
    const effectiveCompany = companyFilter !== 'all' ? companyFilter : selectedCompanyId;
    if (effectiveCompany === 'all') return quotes;
    return quotes.filter(q => q.companyId === effectiveCompany);
  }, [quotes, companyFilter, selectedCompanyId]);

  // Full filtering (company + status + date + search)
  const filteredStats = useMemo(() => {
    let quotesToFilter = [...quotes];
    const effectiveCompanyFilter = companyFilter !== 'all' ? companyFilter : selectedCompanyId;
    if (effectiveCompanyFilter !== 'all') quotesToFilter = quotesToFilter.filter(q => q.companyId === effectiveCompanyFilter);
    if (statusFilter !== 'all') quotesToFilter = quotesToFilter.filter(q => q.status === statusFilter);

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      quotesToFilter = quotesToFilter.filter(q => {
        const quoteDate = new Date(q.date);
        switch (dateFilter) {
          case 'today': return new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate()).getTime() === today.getTime();
          case 'week': { const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7); return quoteDate >= weekAgo; }
          case 'month': return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
          case 'year': return quoteDate.getFullYear() === now.getFullYear();
          default: return true;
        }
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      quotesToFilter = quotesToFilter.filter(q =>
        q.quoteNumber.toLowerCase().includes(term) ||
        q.clientName.toLowerCase().includes(term) ||
        q.clientCompany.toLowerCase().includes(term) ||
        q.clientEmail.toLowerCase().includes(term)
      );
    }

    return {
      quotes: quotesToFilter.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [selectedCompanyId, companyFilter, statusFilter, dateFilter, searchTerm, quotes]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedCompanyId, companyFilter, statusFilter, dateFilter, searchTerm, pageSize]);

  const paginatedQuotes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStats.quotes.slice(start, start + pageSize);
  }, [filteredStats.quotes, currentPage, pageSize]);

  const quoteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    quotes.forEach(q => { map[q.companyId] = (map[q.companyId] || 0) + 1; });
    return map;
  }, [quotes]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const handleDeleteQuote = (quote: Quote) => {
    setConfirmModal({
      isOpen: true, title: 'Eliminar Cotización',
      message: `¿Estás seguro que deseas eliminar la cotización ${quote.quoteNumber}? Esta acción no se puede deshacer.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setDeletingId(quote.id);
          await deleteQuote(quote.id);
          toast.success(`Cotización ${quote.quoteNumber} eliminada`);
        } catch (e: unknown) { const msg = e instanceof Error ? e.message : 'Error'; toast.error(`No se pudo eliminar: ${msg}`); }
        finally { setDeletingId(null); }
      }
    });
  };

  const handleMarkSold = (quote: Quote) => {
    if (quote.status === 'sold') return;
    setConfirmModal({
      isOpen: true, title: 'Marcar como Vendida',
      message: `¿Marcar la cotización ${quote.quoteNumber} como VENDIDA?`,
      variant: 'info',
      onConfirm: async () => {
        try {
          setUpdatingStatusId(quote.id);
          await updateQuote(quote.id, { status: 'sold' });
          toast.success(`Cotización ${quote.quoteNumber} marcada como vendida`);
        } catch (e: unknown) { const msg = e instanceof Error ? e.message : 'Error'; toast.error(`No se pudo actualizar: ${msg}`); }
        finally { setUpdatingStatusId(null); }
      }
    });
  };

  // ── Edit / Create ──
  const openEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setDraft({ ...quote, items: quote.items.map(it => ({ ...it, internalId: it.internalId || crypto.randomUUID() })) });
    setErrorMsg(null);
  };

  const closeEdit = () => { if (saving) return; setEditingQuote(null); setDraft(null); setErrorMsg(null); };

  const updateDraftField = (field: keyof Quote, value: unknown) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const updateItem = (index: number, field: 'description' | 'quantity' | 'price' | 'discountType' | 'discountValue' | 'displayStyle', value: string) => {
    if (!draft) return;
    const items = draft.items.slice();
    if (field === 'quantity') items[index].quantity = parseFloat(value) || 0;
    else if (field === 'price') items[index].price = parseFloat(value) || 0;
    else if (field === 'discountType') { items[index].discountType = value as QuoteItem['discountType']; if (!items[index].discountValue) items[index].discountValue = 0; }
    else if (field === 'discountValue') items[index].discountValue = parseFloat(value) || 0;
    else if (field === 'displayStyle') items[index].displayStyle = value as QuoteItem['displayStyle'];
    else items[index].description = value;
    setDraft({ ...draft, items });
  };

  const addItem = () => {
    if (!draft) return;
    const newItem: QuoteItem = { description: '', quantity: 1, price: 0, internalId: crypto.randomUUID(), discountType: 'percent', discountValue: 0, displayStyle: 'normal' };
    setDraft({ ...draft, items: [...draft.items, newItem] });
  };

  const removeItem = (idx: number) => { if (!draft) return; setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) }); };

  const duplicateItem = (idx: number) => {
    if (!draft) return;
    const items = [...draft.items];
    items.splice(idx + 1, 0, { ...items[idx], internalId: crypto.randomUUID() });
    setDraft({ ...draft, items });
  };

  const moveItem = (from: number, to: number) => {
    if (!draft || to < 0 || to >= draft.items.length) return;
    const items = [...draft.items];
    const [m] = items.splice(from, 1);
    items.splice(to, 0, m);
    setDraft({ ...draft, items });
  };

  const computeTotals = (d: Quote) => {
    const subtotal = d.items.reduce((acc, it) => {
      const lineBase = (it.quantity * it.price) || 0;
      let discount = 0;
      if (it.discountType === 'percent' && it.discountValue) discount = lineBase * (it.discountValue / 100);
      else if (it.discountType === 'amount' && it.discountValue) discount = it.discountValue;
      return acc + Math.max(0, lineBase - discount);
    }, 0);
    const company = companies.find(c => c.id === d.companyId);
    const companyTaxRate = company?.taxRate ?? 0.16;
    const taxRate = d.subtotal > 0 ? (d.tax / d.subtotal) : companyTaxRate;
    const tax = +(subtotal * taxRate).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    return { subtotal, tax, total };
  };

  const generateQuoteNumber = (): string => {
    const prefix = 'Q-';
    const numbers = quotes
      .map(q => q.quoteNumber)
      .filter(n => n?.startsWith(prefix))
      .map(n => parseInt(n.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));
    const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    return prefix + next.toString().padStart(4, '0');
  };

  const openNewQuote = (companyId: string) => {
    if (companyId === 'all') return;
    const now = new Date().toISOString();
    const newDraft: Quote = {
      id: '', companyId, quoteNumber: generateQuoteNumber(), date: now,
      clientName: '', clientCompany: '', clientAddress: '', clientEmail: '', clientPhone: '',
      items: [], subtotal: 0, tax: 0, total: 0, status: 'draft', notes: '', serviceConditions: ''
    };
    setEditingQuote(newDraft);
    setDraft(newDraft);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true); setErrorMsg(null);
    try {
      if (!draft.clientName && !draft.clientCompany) throw new Error('Debes indicar al menos el nombre o la empresa del cliente.');
      if (draft.items.length === 0) throw new Error('Agrega al menos un renglón.');
      const totals = computeTotals(draft);
      const payload = {
        clientName: draft.clientName, clientCompany: draft.clientCompany,
        clientAddress: draft.clientAddress, clientEmail: draft.clientEmail, clientPhone: draft.clientPhone,
        notes: draft.notes || '', serviceConditions: draft.serviceConditions || '', status: draft.status,
        items: draft.items.map(i => ({
          description: i.description, quantity: i.quantity, price: i.price,
          ...(i.discountType ? { discountType: i.discountType, discountValue: i.discountValue || 0 } : {}),
          ...(i.displayStyle ? { displayStyle: i.displayStyle } : {}),
        })),
        subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
        date: draft.date, quoteNumber: draft.quoteNumber, companyId: draft.companyId,
      };
      if (draft.id) {
        await updateQuote(draft.id, payload);
        toast.success(`Cotización ${draft.quoteNumber} actualizada exitosamente`);
      } else {
        await addQuote({ ...payload, createdBy: '' } as any);
        toast.success(`Cotización ${draft.quoteNumber} creada exitosamente`);
      }
      closeEdit();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  };

  // ── Report ──
  const openReportWindow = (quote: Quote) => {
    const company = companies.find(c => c.id === quote.companyId);
    let html = buildQuoteReportHtml(quote, company);
    html = html.replace('<body', '<body data-report-loaded="1"');
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: unknown) { toast.error('Ocurrió un error al abrir el reporte.'); }
  };

  // ── Send Email (mailto) ──
  const handleSendEmail = (quote: Quote) => {
    const company = companies.find(c => c.id === quote.companyId);
    const companyName = company?.name || 'Nuestra empresa';
    const subject = encodeURIComponent(`Cotización ${quote.quoteNumber} - ${companyName}`);
    const body = encodeURIComponent(
      `Estimado/a ${quote.clientName || 'cliente'},\n\n` +
      `Adjunto encontrará la cotización ${quote.quoteNumber} por un monto total de ${formatCurrency(quote.total)}.\n\n` +
      `Quedamos a sus órdenes para cualquier duda o aclaración.\n\n` +
      `Saludos cordiales,\n${companyName}` +
      (company?.phone ? `\nTel: ${company.phone}` : '') +
      (company?.website ? `\n${company.website}` : '')
    );
    const to = quote.clientEmail || '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
    toast.success('Abriendo cliente de correo...');
  };

  const handleDuplicateQuote = (quote: Quote) => {
    try {
      const items: QuoteItem[] = quote.items.map(it => ({
        description: it.description, quantity: it.quantity, price: it.price,
        ...(it.discountType ? { discountType: it.discountType, discountValue: it.discountValue || 0 } : {}),
      }));
      const draftCopy: Quote = {
        id: '', companyId: quote.companyId, quoteNumber: generateQuoteNumber(), date: new Date().toISOString(),
        clientName: quote.clientName, clientCompany: quote.clientCompany, clientAddress: quote.clientAddress,
        clientEmail: quote.clientEmail, clientPhone: quote.clientPhone,
        items, subtotal: 0, tax: 0, total: 0, status: 'draft',
        notes: quote.notes || '', serviceConditions: quote.serviceConditions || ''
      };
      setEditingQuote(draftCopy); setDraft(draftCopy);
    } catch (e: unknown) { toast.error('No se pudo duplicar la cotización'); }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Un resumen de la actividad de cotizaciones.</p>
          </div>
          <button
            onClick={() => {
              if (selectedCompanyId === 'all') {
                toast('Selecciona una empresa primero', { icon: '👆' });
                return;
              }
              openNewQuote(selectedCompanyId);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nueva Cotización
          </button>
        </div>
        <div className="mt-5">
          <CompanyFilter companies={companies} selectedId={selectedCompanyId} onChange={setSelectedCompanyId} counts={quoteCounts} allCount={quotes.length} disabled={isLoading} />
        </div>
      </header>

      {/* ── Stats ── */}
      {isLoading ? <LoadingSkeleton variant="stats" /> : <DashboardStats quotes={companyQuotes} companies={companies} />}

      {/* ── Filters ── */}
      {!isLoading && (
        <QuoteFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
          quotes={quotes} companies={companies}
        />
      )}

      {/* ── Quotes Table ── */}
      <QuotesTable
        quotes={quotes}
        paginatedQuotes={paginatedQuotes}
        totalItems={filteredStats.quotes.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onEdit={openEdit}
        onDuplicate={handleDuplicateQuote}
        onMarkSold={handleMarkSold}
        onDelete={handleDeleteQuote}
        onOpenReport={openReportWindow}
        onSendEmail={handleSendEmail}
        deletingId={deletingId}
        updatingStatusId={updatingStatusId}
        formatCurrency={formatCurrency}
      />

      {/* ── Edit Modal ── */}
      {editingQuote && draft && (
        <QuoteEditModal
          draft={draft}
          companies={companies}
          saving={saving}
          errorMsg={errorMsg}
          onUpdateField={updateDraftField}
          onUpdateItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onDuplicateItem={duplicateItem}
          onMoveItem={moveItem}
          onSave={handleSave}
          onClose={closeEdit}
          onSetDraft={setDraft}
        />
      )}



      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default Dashboard;
