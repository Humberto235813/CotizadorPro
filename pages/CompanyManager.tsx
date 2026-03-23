import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Company } from '../types';
import { BuildingIcon, PlusIcon, EditIcon, TrashIcon } from '../components/icons/Icons';
import EditCompanyModal from '../components/EditCompanyModal';
import { useData } from '../src/contexts/DataContext';
import { useConfirmModal } from '../src/hooks/useConfirmModal';
import ConfirmModal from '../components/ConfirmModal';

type NewCompanyState = Omit<Company, 'id' | 'logo'>;

const CompanyManager: React.FC = () => {
  const { companies, addCompany, updateCompany, deleteCompany } = useData();
  const { confirmState, confirm, closeConfirm } = useConfirmModal();
  const [newCompany, setNewCompany] = useState<NewCompanyState>({ name: '', address: '', phone: '', website: '', bankDetails: '', taxRate: 0.16 });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEditClick = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (companyId: string) => {
    setShowDeleteConfirm(companyId);
  };

  const confirmDelete = async (companyId: string) => {
    try {
      await deleteCompany(companyId);
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Error eliminando empresa');
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompany.name && newCompany.address && newCompany.phone) {
      setIsSubmitting(true);
      try {
        await addCompany(newCompany, logoFile);
        setNewCompany({ name: '', address: '', phone: '', website: '', bankDetails: '', taxRate: 0.16 });
        setLogoFile(null);
        setLogoPreview('');
        const fileInput = document.getElementById('logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Error agregando empresa');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Administrador de Empresas</h1>
        <p className="text-gray-500 mt-1">Crea y gestiona las empresas que pueden emitir cotizaciones.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Crear Nueva Empresa</h2>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-600">Nombre</label>
                <input type="text" name="name" id="name" value={newCompany.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-600">Dirección</label>
                <input type="text" name="address" id="address" value={newCompany.address} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-600">Teléfono</label>
                <input type="tel" name="phone" id="phone" value={newCompany.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-600">Página Web (opcional)</label>
                <input type="url" name="website" id="website" value={newCompany.website || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://ejemplo.com" />
              </div>
               <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-600">Logo</label>
                <input type="file" name="logo" id="logo" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"/>
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-20 w-20 object-contain rounded-md bg-white p-1 shadow-sm" />}
              </div>
              <div>
                <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-600">Datos Bancarios (opcional)</label>
                <textarea name="bankDetails" id="bankDetails" value={newCompany.bankDetails || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Banco, Cuenta, CLABE..." />
              </div>
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-600">Tasa de Impuesto (IVA)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input 
                    type="number" 
                    name="taxRate" 
                    id="taxRate" 
                    value={(newCompany.taxRate ?? 0.16) * 100} 
                    onChange={(e) => setNewCompany(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                    min="0" 
                    max="100" 
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 bg-white/50 border border-gray-300/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="16"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ejemplo: 16 para IVA del 16%</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {isSubmitting ? 'Agregando...' : <><PlusIcon className="h-5 w-5 mr-2" /> Agregar Empresa</>}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
           <div className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-md h-full">
             <h2 className="text-xl font-semibold mb-4 text-gray-700">Empresas Existentes</h2>
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {companies.map(company => (
                  <div key={company.id} className="bg-white/50 p-4 rounded-lg border border-white/30 flex items-start space-x-4">
                     {company.logo ? (
                        <img src={company.logo} alt={`${company.name} logo`} className="h-16 w-16 object-contain rounded-md bg-white p-1 shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="bg-sky-100 p-3 rounded-full flex-shrink-0 h-16 w-16 flex items-center justify-center">
                          <BuildingIcon className="h-8 w-8 text-sky-600"/>
                        </div>
                      )}
                    <div className="flex-grow">
                        <h3 className="font-semibold text-gray-800">{company.name}</h3>
                        <p className="text-sm text-gray-500">{company.address}</p>
                        <p className="text-sm text-gray-500">{company.phone}</p>
                        {company.bankDetails && <p className="text-xs text-green-600 mt-2">✓ Datos bancarios configurados</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditClick(company)} className="p-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200" title="Editar empresa">
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteClick(company.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-200" title="Eliminar empresa">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
      <EditCompanyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        company={selectedCompany}
        updateCompany={updateCompany}
      />
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
