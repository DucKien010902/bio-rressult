'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Info, BellRing, ArrowRight, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  actionUrl?: string;
  actionLabel?: string;
  onClick?: () => void;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    notification: (
      message: string,
      title?: string,
      options?: { duration?: number; actionUrl?: string; actionLabel?: string; onClick?: () => void }
    ) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Event-based global dispatcher (dùng được ở bất cứ file nào không cần hook)
const TOAST_EVENT = 'bio_toast_event';

function dispatchToast(data: Omit<ToastItem, 'id'>) {
  if (typeof window !== 'undefined') {
    const id = Math.random().toString(36).substring(2, 9);
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { ...data, id },
      })
    );
  }
}

export const toast = {
  success: (message: string, title?: string, duration: number = 3500) => {
    dispatchToast({ type: 'success', message, title: title || 'Thành công', duration });
  },
  error: (message: string, title?: string, duration: number = 4500) => {
    dispatchToast({ type: 'error', message, title: title || 'Thất bại', duration });
  },
  warning: (message: string, title?: string, duration: number = 4000) => {
    dispatchToast({ type: 'warning', message, title: title || 'Cảnh báo', duration });
  },
  info: (message: string, title?: string, duration: number = 3500) => {
    dispatchToast({ type: 'info', message, title: title || 'Thông báo', duration });
  },
  notification: (
    message: string,
    title?: string,
    options?: { duration?: number; actionUrl?: string; actionLabel?: string; onClick?: () => void }
  ) => {
    dispatchToast({
      type: 'notification',
      message,
      title: title || 'Thông báo mới',
      duration: options?.duration || 6000,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      onClick: options?.onClick,
    });
  },
};

// Ghi đè ngay lập tức window.alert ở module scope phía client để chặn triệt để popup "localhost:3000 cho biết"
if (typeof window !== 'undefined') {
  window.alert = (msg: any) => {
    const text = String(msg ?? '');
    const lower = text.toLowerCase();
    if (
      lower.includes('lỗi') ||
      lower.includes('thất bại') ||
      lower.includes('không thể') ||
      lower.includes('sai') ||
      lower.includes('hỏng')
    ) {
      toast.error(text, 'Thất bại');
    } else if (
      lower.includes('thành công') ||
      lower.includes('đã lưu') ||
      lower.includes('đã ký') ||
      lower.includes('hoàn tất')
    ) {
      toast.success(text, 'Thành công');
    } else if (
      lower.includes('cảnh báo') ||
      lower.includes('vui lòng') ||
      lower.includes('chú ý') ||
      lower.includes('quyền')
    ) {
      toast.warning(text, 'Cảnh báo');
    } else {
      toast.info(text, 'Thông báo');
    }
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [item, ...prev.slice(0, 4)]); // Tối đa 5 thông báo cùng lúc
  }, []);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleEvent);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleEvent);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Container hiển thị các Toast ở góc trên bên phải */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none select-none max-w-[420px] w-full px-3 sm:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { toast, removeToast: () => {} };
  }
  return context;
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
  duration?: number;
}) {
  const router = useRouter();
  const duration = item.duration || (item.type === 'error' ? 4500 : item.type === 'notification' ? 6000 : 3500);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const config = {
    // Thành công: Màu xanh lá cây (Emerald)
    success: {
      cardBg: 'bg-white border-slate-200/90 border-l-[6px] border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      progressBar: 'bg-emerald-500',
      icon: CheckCircle2,
      shadow: 'shadow-xl shadow-emerald-500/10',
      titleColor: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    // Thất bại: Màu đỏ (Red / Rose)
    error: {
      cardBg: 'bg-white border-slate-200/90 border-l-[6px] border-l-red-500',
      iconBg: 'bg-red-50 text-red-600 border border-red-200',
      progressBar: 'bg-red-500',
      icon: XCircle,
      shadow: 'shadow-xl shadow-red-500/15',
      titleColor: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    },
    // Cảnh báo: Màu vàng hổ phách (Amber)
    warning: {
      cardBg: 'bg-white border-slate-200/90 border-l-[6px] border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
      progressBar: 'bg-amber-500',
      icon: AlertTriangle,
      shadow: 'shadow-xl shadow-amber-500/10',
      titleColor: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
    },
    // Thông tin: Màu xanh dương (Sky)
    info: {
      cardBg: 'bg-white border-slate-200/90 border-l-[6px] border-l-blue-500',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
      progressBar: 'bg-blue-500',
      icon: Info,
      shadow: 'shadow-xl shadow-blue-500/10',
      titleColor: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    // Thông báo sự kiện hệ thống (Real-time Notification toast)
    notification: {
      cardBg: 'bg-white border-blue-200 border-l-[6px] border-l-[#0070f3]',
      iconBg: 'bg-blue-50 text-[#0070f3] border border-blue-200',
      progressBar: 'bg-[#0070f3]',
      icon: BellRing,
      shadow: 'shadow-2xl shadow-blue-500/25 ring-1 ring-blue-500/10',
      titleColor: 'text-[#0070f3]',
      badge: 'bg-blue-100 text-blue-800',
    },
  }[item.type];

  const IconComponent = config.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[data-close="true"]')) {
      return;
    }
    if (item.onClick) {
      item.onClick();
      onDismiss();
    } else if (item.actionUrl) {
      router.push(item.actionUrl);
      onDismiss();
    }
  };

  const isClickable = Boolean(item.onClick || item.actionUrl);

  return (
    <div
      onClick={handleCardClick}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${config.cardBg} ${config.shadow} ${
        isClickable ? 'cursor-pointer hover:scale-[1.01] hover:shadow-2xl' : ''
      }`}
      style={{ minWidth: '320px' }}
    >
      <div className="flex items-start gap-3">
        {/* Icon Pill */}
        <div
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${config.iconBg} ${
            item.type === 'notification' ? 'animate-bounce' : ''
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-6 pt-0.5">
          {item.title && (
            <h4 className={`text-xs font-black tracking-tight mb-1 uppercase ${config.titleColor}`}>
              {item.title}
            </h4>
          )}
          <p className="text-xs font-semibold text-slate-700 leading-snug">
            {item.message}
          </p>

          {item.actionUrl && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0070f3] hover:underline">
              <span>{item.actionLabel || 'Xem phiếu xét nghiệm'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          data-close="true"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thanh chạy thời gian (Progress Bar Countdown) */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100/90 overflow-hidden">
        <div
          className={`h-full ${config.progressBar} toast-progress-bar`}
          style={{
            animation: `toastProgress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
