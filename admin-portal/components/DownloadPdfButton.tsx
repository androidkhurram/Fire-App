'use client';

import { useCallback } from 'react';

interface DownloadPdfButtonProps {
  elementId: string;
  title?: string;
}

export function DownloadPdfButton({ elementId, title = 'Report' }: DownloadPdfButtonProps) {
  const handleDownloadPdf = useCallback(() => {
    window.print();
  }, []);

  return (
    <button
      onClick={handleDownloadPdf}
      className="print:hidden px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
    >
      <span>📥</span>
      Download PDF
    </button>
  );
}
