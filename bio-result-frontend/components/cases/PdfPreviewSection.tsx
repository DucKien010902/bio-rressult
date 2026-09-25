'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Download, X, Layers, RefreshCw } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';

export interface PdfTemplateItem {
  id: string;
  name: string;
  category: string;
  isDefault?: boolean;
  description?: string;
}

interface PdfPreviewSectionProps {
  caseId: string;
  patientName?: string;
  currentTemplate?: string;
  onClose?: () => void;
  onDownload?: (templateId?: string) => void;
  onTemplateChange?: (templateId: string) => void;
}

export default function PdfPreviewSection({
  caseId,
  patientName = '',
  currentTemplate = '',
  onClose,
  onDownload,
  onTemplateChange,
}: PdfPreviewSectionProps) {
  const [templates, setTemplates] = useState<PdfTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());

  // Lấy danh sách các mẫu in có sẵn cho ca này từ Backend
  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch(getApiUrl(`/cases/${caseId}/pdf-templates`), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const list: PdfTemplateItem[] = data.templates || [];
            setTemplates(list);

            // Ưu tiên: template truyền từ ngoài vào > selectedTemplate từ backend > mẫu đầu tiên
            const initialTpl =
              currentTemplate && list.some((t) => t.id === currentTemplate)
                ? currentTemplate
                : data.selectedTemplate || list[0]?.id || '';
            setSelectedTemplate(initialTpl);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách template PDF:', err);
      } finally {
        if (isMounted) setLoadingTemplates(false);
      }
    };

    if (caseId) {
      fetchTemplates();
    }
    return () => {
      isMounted = false;
    };
  }, [caseId, currentTemplate]);

  const handleSelectTemplate = (newTplId: string) => {
    setSelectedTemplate(newTplId);
    setRefreshKey(Date.now());
    if (onTemplateChange) {
      onTemplateChange(newTplId);
    }
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(selectedTemplate);
    } else {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bio_token') || '' : '';
      const query = `?template=${encodeURIComponent(selectedTemplate)}&token=${encodeURIComponent(token)}`;
      window.open(getApiUrl(`/cases/${caseId}/export-pdf${query}`), '_blank');
    }
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('bio_token') || '' : '';
  const iframeSrc = `${getApiUrl(
    `/cases/${caseId}/export-pdf`
  )}?template=${encodeURIComponent(selectedTemplate)}&token=${encodeURIComponent(token)}&_t=${refreshKey}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 className="text-sm font-bold text-slate-800">
            Xem trước phiếu kết quả PDF {patientName ? `: ${patientName}` : ''}
          </h3>
        </div>

        {/* Lựa chọn mẫu in PDF linh hoạt */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-600">Chọn mẫu in:</span>
            {loadingTemplates ? (
              <span className="text-xs text-slate-400 italic">Đang tải mẫu...</span>
            ) : templates.length > 1 ? (
              <select
                value={selectedTemplate}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-blue-700 outline-none cursor-pointer pr-1"
                title="Lựa chọn biểu mẫu PDF để in hoặc tải về"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {templates[0]?.name || 'Mẫu chuẩn GenHD'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey(Date.now())}
            title="Tải lại bản xem trước"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDownloadClick}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải PDF về máy</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Iframe Viewer */}
      <div className="w-full h-[750px] bg-slate-100 relative">
        <iframe
          key={`${selectedTemplate}-${refreshKey}`}
          src={iframeSrc}
          className="w-full h-full border-0"
          title="Xem trước kết quả PDF"
        />
      </div>
    </div>
  );
}
