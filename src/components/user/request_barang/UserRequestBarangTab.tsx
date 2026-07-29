'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/lib/store';
import { RequesterInfoForm } from './RequesterInfoForm';
import { ApproverSelection } from './ApproverSelection';
import { NonStandardToolForm } from './NonStandardToolForm';
import { INITIAL_APPROVERS } from '@/src/lib/mock';


interface UserRequestBarangTabProps {
  onGoToCatalog: () => void;
  setToastMessage: (msg: string | null) => void;
}

export const UserRequestBarangTab: React.FC<UserRequestBarangTabProps> = ({
  setToastMessage,
}) => {
  const { submitNonStandardRequest, userRequests, session } = useAppStore();

  const [requesterName, setRequesterName] = useState<string>('');
  const [selectedApprover, setSelectedApprover] = useState<string>('');
  const [formData, setFormData] = useState({
    toolName: '',
    vendorName: '',
    price: '',
    contact: '',
    dimensions: '',
    imageUrl: '',
  });

  // Pre-fill requester name with session data
  useEffect(() => {
    if (session.userName) {
      setRequesterName(session.userName);
    }
  }, [session.userName]);

  const myRequests = userRequests.filter(
    (req) => req.userName === session.userName || req.department === session.department?.name
  );

  const activeRequests = myRequests.filter(
    (req) => req.status === 'Pending' || req.status === 'Approved'
  );

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requesterName || !selectedApprover || !formData.toolName || !formData.vendorName || !formData.price || !formData.contact || !formData.dimensions || !formData.imageUrl) {
      alert("Mohon isi semua field yang diwajibkan (*).");
      return;
    }

    const approverName = INITIAL_APPROVERS.find(a => a.id === selectedApprover)?.name || selectedApprover;

    const res = submitNonStandardRequest({
      approver: approverName,
      toolName: formData.toolName,
      vendorName: formData.vendorName,
      price: Number(formData.price),
      contact: formData.contact,
      dimensions: formData.dimensions,
      imageUrl: formData.imageUrl,
    }, `Request Non-Standard: ${formData.toolName} (Pemohon: ${requesterName}, Menunggu Approval: ${approverName})`);

    if (res.success) {
      setToastMessage(res.message || 'Request Non-Standard berhasil diajukan!');
      // Reset form
      setSelectedApprover('');
      setFormData({
        toolName: '',
        vendorName: '',
        price: '',
        contact: '',
        dimensions: '',
        imageUrl: '',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Request Barang (Non-Standard)</h2>
          <p className="text-base text-red-100 mt-2 max-w-xl">
            Gunakan form ini untuk mengajukan permintaan alat/barang baru yang <strong>tidak terdapat di Master Data (Katalog)</strong>. Pengajuan ini membutuhkan persetujuan (approval) sebelum diproses ke Procurement.
          </p>
        </div>
      </div>

      <div className="w-full">
        {/* Main Form */}
        <div className="w-full space-y-4">
          <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">

            {/* Step 1: Requester Identity */}
            <RequesterInfoForm
              requesterName={requesterName}
              setRequesterName={setRequesterName}
            />

            {/* Step 2: Approver Selection */}
            <ApproverSelection
              selectedApprover={selectedApprover}
              setSelectedApprover={setSelectedApprover}
              disabled={!requesterName}
            />

            {/* Step 3: Tool Details */}
            <NonStandardToolForm
              formData={formData}
              handleFormChange={handleFormChange}
              disabled={!selectedApprover || !requesterName}
              canSubmit={!!(requesterName && selectedApprover)}
            />

          </form>
        </div>
      </div>
    </div>
  );
};
