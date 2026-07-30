import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface RejectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectItemModal: React.FC<RejectItemModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (rejectReason.trim()) {
      onConfirm(rejectReason);
      setRejectReason('');
    } else {
      alert("Alasan penolakan tidak boleh kosong.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-2xl text-slate-900">Tolak Permintaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <XCircle className="w-8 h-8" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-3">
              Alasan Penolakan
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
              placeholder="Misal: Stok sedang kosong..."
              rows={4}
              autoFocus
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg transition-colors shadow-sm"
          >
            Konfirmasi Penolakan
          </button>
        </div>
      </div>
    </div>
  );
};
