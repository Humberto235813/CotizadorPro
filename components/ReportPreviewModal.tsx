import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ReportPreviewModalProps {
    reportHtml: string;
    onClose: () => void;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({ reportHtml, onClose }) => {
    const [reportUrl, setReportUrl] = useState<string | null>(null);

    // Generate Blob URL from HTML
    useEffect(() => {
        if (!reportHtml) return;
        try {
            const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setReportUrl(url);
            return () => URL.revokeObjectURL(url);
        } catch (e) {
            toast.error('Error creando vista previa del reporte');
        }
    }, [reportHtml]);

    const openInNewTab = () => {
        if (!reportHtml) return;
        try {
            const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank', 'noopener');
            if (!w) {
                URL.revokeObjectURL(url);
            } else {
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } catch (e) {
            toast.error('Error abriendo reporte en nueva pestaña');
        }
    };

    const printReport = () => {
        const iframe = document.getElementById('report-iframe') as HTMLIFrameElement | null;
        iframe?.contentWindow?.print();
    };

    return (
        <dialog open aria-label="Vista previa de cotización" className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/90 backdrop-blur">
                    <h3 className="font-semibold text-gray-700 text-sm md:text-base">Vista previa de Cotización</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={openInNewTab} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">Abrir en pestaña</button>
                        <button onClick={printReport} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">Imprimir</button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded px-2 py-1" aria-label="Cerrar">✕</button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100">
                    <iframe
                        id="report-iframe"
                        title="Reporte"
                        className="w-full h-full bg-white"
                        src={reportUrl || 'about:blank'}
                    />
                </div>
            </div>
        </dialog>
    );
};

export default ReportPreviewModal;
