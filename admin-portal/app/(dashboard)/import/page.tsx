'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a CSV or Excel file');
      return;
    }
    setStatus('Upload not yet implemented. Use Supabase Edge Function for CSV import.');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Data Import</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <p className="text-gray-600 mb-4">
          Upload a CSV or Excel file to import customers. Supported columns: customer_name, business_name, address, phone, email, last_service_date, system_type.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="mb-4"
          />
          {file && <p className="text-sm text-gray-600 mb-2">Selected: {file.name}</p>}
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Upload & Import
          </button>
        </div>
        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>
    </div>
  );
}
