import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { EditIcon, SaveIcon, CancelIcon } from './icons/Icons';
import { toast } from 'react-hot-toast';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  updateCompany: (id: string, data: Omit<Company, 'id' | 'logo'>, logoFile: File | null) => Promise<void>;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ isOpen, onClose, company, updateCompany }) => {
  const [formData, setFormData] = useState<Omit<Company, 'id' | 'logo'>>({ name: '', rfc: '', address: '', phone: '', website: '', bankDetails: '', taxRate: 0.16 });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        rfc: company.rfc || '',
        address: company.address,
        phone: company.phone,
        website: company.website || '',
        bankDetails: company.bankDetails || '',
        taxRate: company.taxRate ?? 0.16,
      });
      setLogoPreview(company.logo || '');
      setLogoFile(null);
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCompany(company.id, formData, logoFile);
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error actualizando empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/80 border border-white/30 rounded-2xl shadow-xl p-8 m-4 max-w-lg w-full transform transition-all duration-300 ease-in-out">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><EditIcon className="h-6 w-6 mr-3" /> Editar Empresa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-600">Nombre</label>
            <input type="text" name="name" id="edit-name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label htmlFor="edit-rfc" className="block text-sm font-medium text-gray-600">RFC</label>
            <input type="text" name="rfc" id="edit-rfc" value={formData.rfc || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase" placeholder="Ej: SGR1203284Q0" maxLength={13} />
          </div>
          <div>
            <label htmlFor="edit-address" className="block text-sm font-medium text-gray-600">Dirección</label>
            <input type="text" name="address" id="edit-address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-600">Teléfono</label>
            <input type="tel" name="phone" id="edit-phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label htmlFor="edit-website" className="block text-sm font-medium text-gray-600">Página Web (opcional)</label>
            <input type="url" name="website" id="edit-website" value={formData.website || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://ejemplo.com" />
          </div>
          <div>
            <label htmlFor="edit-logo" className="block text-sm font-medium text-gray-600">Logo</label>
            <input type="file" name="logo" id="edit-logo" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-20 w-20 object-contain rounded-md bg-white p-1 shadow-sm" />}
          </div>
          <div>
            <label htmlFor="edit-bankDetails" className="block text-sm font-medium text-gray-600">Datos Bancarios (opcional)</label>
            <textarea name="bankDetails" id="edit-bankDetails" value={formData.bankDetails || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="edit-taxRate" className="block text-sm font-medium text-gray-600">Tasa de Impuesto (IVA)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name="taxRate"
                id="edit-taxRate"
                value={(formData.taxRate ?? 0.16) * 100}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 bg-white/80 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="16"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Ejemplo: 16 para IVA del 16%</p>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <CancelIcon className="h-5 w-5 mr-2" /> Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {isSubmitting ? 'Guardando...' : <><SaveIcon className="h-5 w-5 mr-2" /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompanyModal;
