import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Contact } from '../../types';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

/* ─── Email Templates ─── */
const EMAIL_TEMPLATES = [
  {
    id: 'followup',
    name: 'Seguimiento',
    subject: 'Seguimiento a nuestra conversación',
    body: `Estimado/a {{nombre}},\n\nEspero que se encuentre bien. Me pongo en contacto para dar seguimiento a nuestra conversación reciente.\n\nQuedo al pendiente de cualquier duda o consulta.\n\nSaludos cordiales,\n{{remitente}}`,
  },
  {
    id: 'proposal',
    name: 'Propuesta Comercial',
    subject: 'Propuesta comercial para {{empresa}}',
    body: `Estimado/a {{nombre}},\n\nAdjunto a este correo encontrará la propuesta comercial que preparamos especialmente para {{empresa}}.\n\nNos encantaría agendar una reunión para revisar los detalles.\n\n¿Le parece bien la próxima semana?\n\nSaludos,\n{{remitente}}`,
  },
  {
    id: 'thankyou',
    name: 'Agradecimiento',
    subject: 'Gracias por su preferencia',
    body: `Estimado/a {{nombre}},\n\nQueremos agradecer su confianza en nuestros servicios. Para nosotros es un placer contar con clientes como usted.\n\nSi hay algo más en lo que podamos ayudarles, no dude en contactarnos.\n\n¡Gracias!\n{{remitente}}`,
  },
  {
    id: 'promotion',
    name: 'Promoción / Oferta',
    subject: '🎉 Oferta especial para {{empresa}}',
    body: `Hola {{nombre}},\n\nTenemos una oferta exclusiva que no querrá perderse.\n\n[Describe tu oferta aquí]\n\nEsta promoción es por tiempo limitado. ¡Contáctenos para más detalles!\n\nSaludos,\n{{remitente}}`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter / Boletín',
    subject: 'Novedades de 3HR Consultores — {{mes}}',
    body: `Hola {{nombre}},\n\nLe compartimos las novedades más recientes:\n\n📌 [Novedad 1]\n📌 [Novedad 2]\n📌 [Novedad 3]\n\nPara más información visite nuestro sitio web.\n\n¡Hasta pronto!\nEquipo 3HR`,
  },
];

/* ─── Component ─── */
const EmailCampaignPage: React.FC = () => {
  const { contacts } = useData();
  const { user } = useAuth();

  /* ── Selection ── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  /* ── Composer ── */
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  /* ── UI State ── */
  const [step, setStep] = useState<'select' | 'compose' | 'preview' | 'sent'>('select');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  /* ── Derived ── */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let list = contacts.filter((c) => c.email?.trim());
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q)
      );
    }
    if (tagFilter !== 'all') {
      list = list.filter((c) => c.tags?.includes(tagFilter));
    }
    return list;
  }, [contacts, searchTerm, tagFilter]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedIds.has(c.id)),
    [contacts, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const applyTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSubject(tpl.subject);
    setBody(tpl.body);
    setActiveTemplate(templateId);
  };

  const interpolate = (text: string, contact: Contact) => {
    const month = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return text
      .replace(/\{\{nombre\}\}/g, contact.name || 'Cliente')
      .replace(/\{\{empresa\}\}/g, contact.company || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{remitente\}\}/g, user?.displayName || user?.email || 'CRM by Servicios GRV')
      .replace(/\{\{mes\}\}/g, month);
  };

  /* ── Send Campaign ── */
  const handleSendCampaign = async () => {
    if (selectedContacts.length === 0 || !subject.trim() || !body.trim()) return;
    setSending(true);
    let sent = 0;
    try {
      for (const contact of selectedContacts) {
        await addDoc(collection(db, 'mail'), {
          to: contact.email,
          message: {
            subject: interpolate(subject, contact),
            html: interpolate(body, contact).replace(/\n/g, '<br>'),
            text: interpolate(body, contact),
          },
          contactId: contact.id,
          contactName: contact.name,
          campaignSubject: subject,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || '',
          status: 'pending',
        });
        sent++;
      }
      setSentCount(sent);
      setStep('sent');
      toast.success(`${sent} correos en cola de envío`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error enviando';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSelectedIds(new Set());
    setSubject('');
    setBody('');
    setActiveTemplate(null);
    setStep('select');
    setSentCount(0);
  };

  /* ────────────── RENDER ────────────── */
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Correo Masivo"
        subtitle="Envía correos personalizados a tus clientes"
        breadcrumb={['CRM', 'Correo Masivo']}
      >
        {step !== 'select' && step !== 'sent' && (
          <button
            onClick={() => setStep(step === 'preview' ? 'compose' : 'select')}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            ← Regresar
          </button>
        )}
      </PageHeader>

      {/* ── Progress Steps ── */}
      <div className="flex items-center gap-2 mb-8">
        {['select', 'compose', 'preview', 'sent'].map((s, i) => {
          const labels = ['1. Seleccionar', '2. Redactar', '3. Vista Previa', '4. Enviado'];
          const isActive = step === s;
          const isDone = ['select', 'compose', 'preview', 'sent'].indexOf(step) > i;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                    : isDone
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isDone && !isActive ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : null}
                <span className="hidden sm:inline">{labels[i]}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ══════════ STEP 1: SELECT CONTACTS ══════════ */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o empresa..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:outline-none text-gray-800 dark:text-gray-200"
              />
            </div>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="all">Todas las etiquetas</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Selection summary */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-800/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="px-3 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                {selectedIds.size === filteredContacts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              <span className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">
                {selectedIds.size} de {filteredContacts.length} contactos seleccionados
              </span>
            </div>
            <button
              onClick={() => setStep('compose')}
              disabled={selectedIds.size === 0}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              Continuar →
            </button>
          </div>

          {/* Contacts Table */}
          {filteredContacts.length === 0 ? (
            <EmptyState
              title="Sin contactos con email"
              description="Agrega contactos con dirección de correo electrónico para poder enviarles campañas."
              actionLabel="Ir a Clientes"
              onAction={() => window.location.href = '/clients'}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-sm">
              <table className="w-full text-sm" role="grid">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-400">Nombre</th>
                    <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Empresa</th>
                    <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-400">Email</th>
                    <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Etiquetas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => toggleSelect(c.id)}
                      className={`border-t border-gray-100 dark:border-gray-700/50 cursor-pointer transition-colors ${
                        selectedIds.has(c.id)
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Seleccionar ${c.name}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{c.company || '—'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{c.email}</td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {(c.tags || []).slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{t}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ STEP 2: COMPOSE ══════════ */}
      {step === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Templates */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Plantillas</h3>
            {EMAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  activeTemplate === tpl.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800'
                }`}
              >
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{tpl.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tpl.subject}</p>
              </button>
            ))}

            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Variables disponibles</p>
              <div className="text-xs text-amber-600 dark:text-amber-500 space-y-0.5">
                <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{'{{nombre}}'}</code> — Nombre del contacto</p>
                <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{'{{empresa}}'}</code> — Empresa</p>
                <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{'{{email}}'}</code> — Email</p>
                <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{'{{remitente}}'}</code> — Tu nombre</p>
                <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{'{{mes}}'}</code> — Mes actual</p>
              </div>
            </div>
          </div>

          {/* Right: Composer */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label htmlFor="email-subject" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Asunto
              </label>
              <input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Escribe el asunto del correo..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="email-body" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Cuerpo del correo
              </label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                placeholder="Escribe el contenido del correo. Usa {{nombre}}, {{empresa}} para personalizar..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-mono leading-relaxed resize-y focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {selectedIds.size} destinatarios · {body.length} caracteres
              </p>
              <button
                onClick={() => setStep('preview')}
                disabled={!subject.trim() || !body.trim()}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 dark:shadow-none"
              >
                Vista Previa →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP 3: PREVIEW ══════════ */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Destinatarios</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{selectedContacts.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Asunto</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2 truncate">{subject}</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Plantilla</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2">
                {activeTemplate ? EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.name : 'Personalizado'}
              </p>
            </div>
          </div>

          {/* Preview: First Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
            <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vista previa (primer destinatario)</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Para: <span className="text-indigo-600 dark:text-indigo-400">{selectedContacts[0]?.email}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Asunto: <strong>{interpolate(subject, selectedContacts[0])}</strong>
              </p>
            </div>
            <div className="p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {interpolate(body, selectedContacts[0])}
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5">
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">Lista de Destinatarios</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedContacts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[10px] font-bold">{c.name.charAt(0)}</span>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Los correos se encolarán para envío. Requiere configuración de Firebase Extension &quot;Trigger Email&quot;.
            </p>
            <button
              onClick={handleSendCampaign}
              disabled={sending}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Enviar {selectedContacts.length} correos
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 4: SENT ══════════ */}
      {step === 'sent' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-200 dark:shadow-none">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Campaña enviada!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {sentCount} correos encolados exitosamente para envío.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
            >
              Nueva Campaña
            </button>
            <a
              href="/clients"
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Ir a Clientes
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaignPage;
