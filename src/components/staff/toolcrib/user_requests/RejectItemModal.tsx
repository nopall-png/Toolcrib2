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
      <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Tolak Permintaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Alasan Penolakan
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Misal: Stok sedang kosong..."
              rows={4}
              autoFocus
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-sm"
          >
            Konfirmasi Penolakan
          </button>
        </div>
      </div>
    </div>
  );
};
