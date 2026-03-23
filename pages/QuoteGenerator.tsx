import React, { useState, useMemo, useEffect } from 'react';
import { Company, QuoteItem, Quote } from '../types';
import {
    PlusIcon, TrashIcon, CopyIcon, SaveIcon, CheckIcon, SpinnerIcon,
    UserIcon, CompanyIcon, LocationIcon, EmailIcon, PhoneIcon,
    NoteIcon, SettingsIcon, AlertIcon
} from '../components/icons/Icons';
import { InputWithIcon, TextAreaWithIcon } from '../components/FormInputs';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { buildQuoteHtml } from '../report/buildQuoteReportHtml';
import { toast } from 'react-hot-toast';

interface QuoteGeneratorProps {
    company: Company;
    quoteToEdit: Quote | null;
    onFinishEditing: () => void;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ company, quoteToEdit, onFinishEditing }) => {
    // Client info states
    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [serviceConditions, setServiceConditions] = useState('');
    const [vigenciaDias, setVigenciaDias] = useState<30 | 60 | 90>(30);

    // UI states
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [items, setItems] = useState<QuoteItem[]>([]);

    // Validation states
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load quote data if editing
    useEffect(() => {
        if (quoteToEdit) {
            setClientName(quoteToEdit.clientName);
            setClientCompany(quoteToEdit.clientCompany);
            setClientAddress(quoteToEdit.clientAddress);
            setClientEmail(quoteToEdit.clientEmail);
            setClientPhone(quoteToEdit.clientPhone);
            setNotes(quoteToEdit.notes || '');
            setServiceConditions(quoteToEdit.serviceConditions || '');
            setVigenciaDias(quoteToEdit.vigenciaDias || 30);
            setItems(quoteToEdit.items.map(i => ({ ...i, id: Math.random().toString() })));
        } else {
            // Reset form for new quote
            setClientName('');
            setClientCompany('');
            setClientAddress('');
            setClientEmail('');
            setClientPhone('');
            setNotes('');
            setServiceConditions('');
            setVigenciaDias(30);
            setItems([
                { id: '1', description: 'Diseño de Sitio Web Corporativo', quantity: 1, price: 2500 },
                { id: '2', description: 'Desarrollo de E-commerce', quantity: 1, price: 4000 },
            ]);
        }
    }, [quoteToEdit]);

    // Validation logic
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!clientName.trim()) newErrors.clientName = 'El nombre del contacto es requerido';
        if (!clientCompany.trim()) newErrors.clientCompany = 'El nombre de la empresa es requerido';
        if (!clientEmail.trim()) {
            newErrors.clientEmail = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
            newErrors.clientEmail = 'El email no es válido';
        }

        if (items.length === 0) {
            newErrors.items = 'Debes agregar al menos un concepto';
        } else {
            const hasInvalidItems = items.some(item => !item.description.trim() || item.price <= 0);
            if (hasInvalidItems) {
                newErrors.items = 'Todos los conceptos deben tener descripción y precio mayor a 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Item handlers
    const handleItemChange = <K extends keyof QuoteItem>(id: string, field: K, value: QuoteItem[K]) => {
        setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
    };

    const addItem = () => {
        setItems(p => [...p, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            toast.error('Debes tener al menos un concepto');
            return;
        }
        setItems(p => p.filter(it => it.id !== id));
    };

    const duplicateItem = (id: string) => {
        const itemToDuplicate = items.find(it => it.id === id);
        if (itemToDuplicate) {
            const newItem = {
                ...itemToDuplicate,
                id: Date.now().toString(),
                description: `${itemToDuplicate.description} (copia)`
            };
            setItems(p => [...p, newItem]);
            toast.success('Concepto duplicado');
        }
    };

    // Calculations
    const { subtotal, tax, total } = useMemo(() => {
        const sub = items.reduce((a, it) => {
            const itemTotal = it.quantity * it.price;
            const discount = it.discount || 0;
            return a + (itemTotal * (1 - discount / 100));
        }, 0);
        const taxAmount = sub * 0.16;
        return { subtotal: sub, tax: taxAmount, total: sub + taxAmount };
    }, [items]);

    const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    // Save functions
    const saveQuote = async (status: 'created' | 'draft'): Promise<string | null> => {
        if (!validateForm()) {
            toast.error('Por favor corrige los errores antes de guardar');
            return null;
        }

        setIsSaving(true);
        setSaveStatus('saving');

        const data = {
            companyId: company.id,
            date: quoteToEdit ? quoteToEdit.date : new Date().toISOString(),
            clientName,
            clientCompany,
            clientAddress,
            clientEmail,
            clientPhone,
            items: items.map(({ id, ...r }) => r),
            subtotal,
            tax,
            total,
            notes,
            serviceConditions,
            vigenciaDias,
            status
        };

        try {
            if (quoteToEdit) {
                await updateDoc(doc(db, 'quotes', quoteToEdit.id), data);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
                return quoteToEdit.quoteNumber;
            }
            const quoteNumber = `C-${Date.now().toString().slice(-6)}`;
            await addDoc(collection(db, 'quotes'), { ...data, quoteNumber });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            return quoteNumber;
        } catch (e: unknown) {
            setSaveStatus('error');
            toast.error('Error guardando la cotización');
            setTimeout(() => setSaveStatus('idle'), 2000);
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const saveDraft = async () => {
        const qn = await saveQuote('draft');
        if (qn && !quoteToEdit) {
            toast.success('Borrador guardado exitosamente');
        }
        if (quoteToEdit) onFinishEditing();
    };

    const generateHtmlPage = async () => {
        const qn = await saveQuote('created');
        if (!qn) return;

        const dateISO = quoteToEdit ? quoteToEdit.date : new Date().toISOString();
        const fecha = new Date(dateISO).toLocaleDateString('es-MX');

        const html = buildQuoteHtml({
            company: {
                name: company.name,
                address: company.address,
                phone: company.phone,
                logo: company.logo,
                primaryColor: company.primaryColor
            },
            quote: { number: qn, date: fecha, subtotal, tax, total, vigenciaDias },
            client: {
                name: clientName,
                company: clientCompany,
                address: clientAddress,
                email: clientEmail,
                phone: clientPhone
            },
            items: items.map(i => ({ description: i.description, quantity: i.quantity, price: i.price })),
            notes,
            conditions: serviceConditions,
            bank: company.bankDetails
        });

        const w = window.open('', '_blank', 'noopener');
        if (!w) return;
        const docEl = w.document;
        docEl.open();
        const tmp = docEl.createElement('html');
        tmp.innerHTML = html;
        while (docEl.firstChild) docEl.removeChild(docEl.firstChild);
        Array.from(tmp.childNodes).forEach(n => docEl.appendChild(n.cloneNode(true)));
        docEl.close();

        if (quoteToEdit) onFinishEditing();
        toast.success('Cotización generada exitosamente');
    };

    return (
        <div className="mt-8 bg-white/90 backdrop-blur rounded-2xl shadow-lg p-8 border border-gray-200/60">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {quoteToEdit ? 'Editar Cotización' : 'Nueva Cotización'}
                </h2>
                <div className="space-x-3 flex items-center">
                    <button
                        onClick={saveDraft}
                        disabled={isSaving}
                        className="px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                    >
                        {saveStatus === 'saving' && <SpinnerIcon className="w-4 h-4" />}
                        {saveStatus === 'saved' && <CheckIcon className="w-4 h-4 text-green-600" />}
                        <SaveIcon className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Guardar Borrador'}
                    </button>
                    <button
                        onClick={generateHtmlPage}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
                    >
                        Generar Cotización
                    </button>
                </div>
            </div>

            {/* Client Information Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-indigo-600" />
                    Información del Cliente
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <InputWithIcon
                        icon={<UserIcon />}
                        label="Nombre del Contacto"
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        onBlur={() => setTouched({ ...touched, clientName: true })}
                        error={touched.clientName ? errors.clientName : undefined}
                        placeholder="Ej: Juan Pérez"
                    />

                    <InputWithIcon
                        icon={<CompanyIcon />}
                        label="Empresa"
                        required
                        value={clientCompany}
                        onChange={e => setClientCompany(e.target.value)}
                        onBlur={() => setTouched({ ...touched, clientCompany: true })}
                        error={touched.clientCompany ? errors.clientCompany : undefined}
                        placeholder="Ej: Acme Corporation"
                    />

                    <InputWithIcon
                        icon={<LocationIcon />}
                        label="Dirección"
                        value={clientAddress}
                        onChange={e => setClientAddress(e.target.value)}
                        placeholder="Ej: Av. Reforma 123, CDMX"
                    />

                    <InputWithIcon
                        icon={<EmailIcon />}
                        label="Correo Electrónico"
                        required
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, clientEmail: true })}
                        error={touched.clientEmail ? errors.clientEmail : undefined}
                        placeholder="Ej: contacto@empresa.com"
                    />

                    <InputWithIcon
                        icon={<PhoneIcon />}
                        label="Teléfono"
                        type="tel"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        placeholder="Ej: 55 1234 5678"
                    />
                </div>
            </div>

            {/* Items/Concepts Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        Conceptos
                    </h3>
                    <button
                        onClick={addItem}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Añadir Concepto
                    </button>
                </div>

                {errors.items && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertIcon className="w-5 h-5" />
                        <span className="text-sm">{errors.items}</span>
                    </div>
                )}

                <div className="overflow-x-auto border-2 border-gray-200 rounded-xl">
                    <table className="w-full table-fixed text-sm">
                        <colgroup>
                            <col className="w-[54%]" />
                            <col className="w-[10%]" />
                            <col className="w-[14%]" />
                            <col className="w-[14%]" />
                            <col className="w-[8%]" />
                        </colgroup>
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr className="text-left text-gray-700 font-semibold">
                                <th className="p-3 border-b">Descripción</th>
                                <th className="p-3 text-center border-b">Cant.</th>
                                <th className="p-3 text-right border-b">P. Unit.</th>
                                <th className="p-3 text-right border-b">Importe</th>
                                <th className="p-3 text-center border-b">Acc.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="p-3">
                                        <input
                                            value={item.description}
                                            onChange={e => handleItemChange(item.id!, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                                            placeholder="Descripción del servicio o producto"
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={e => handleItemChange(item.id!, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                                        />
                                    </td>
                                    <td className="p-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={e => handleItemChange(item.id!, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-gray-900">
                                        {formatCurrency(item.quantity * item.price)}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => duplicateItem(item.id!)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Duplicar concepto"
                                            >
                                                <CopyIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar concepto"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes and Conditions Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <NoteIcon className="w-5 h-5 text-indigo-600" />
                    Notas y Condiciones
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <TextAreaWithIcon
                        icon={<NoteIcon />}
                        label="Notas Adicionales"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Información adicional para el cliente..."
                        rows={4}
                    />

                    <TextAreaWithIcon
                        icon={<SettingsIcon />}
                        label="Condiciones del Servicio"
                        value={serviceConditions}
                        onChange={e => setServiceConditions(e.target.value)}
                        placeholder="Términos y condiciones del servicio..."
                        rows={4}
                    />
                </div>

                {/* Vigencia de la cotización */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vigencia de la Cotización
                    </label>
                    <div className="flex gap-3">
                        {([30, 60, 90] as const).map(dias => (
                            <button
                                key={dias}
                                type="button"
                                onClick={() => setVigenciaDias(dias)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${vigenciaDias === dias
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                            >
                                {dias} días
                            </button>
                        ))}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                        La cotización será válida por {vigenciaDias} días a partir de la fecha de emisión.
                    </p>
                </div>
            </div>

            {/* Totals Section */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex flex-col items-end space-y-3">
                    <div className="flex items-center gap-4 text-gray-700">
                        <span className="text-sm font-medium">Subtotal:</span>
                        <span className="text-lg font-semibold min-w-[150px] text-right">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700">
                        <span className="text-sm font-medium">IVA (16%):</span>
                        <span className="text-lg font-semibold min-w-[150px] text-right">{formatCurrency(tax)}</span>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-indigo-700 min-w-[150px] text-right">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuoteGenerator;
