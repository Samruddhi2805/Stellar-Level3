import { useEffect } from "react";

export type ToastType = "error" | "warning" | "info" | "success";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
}

interface ToastProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
    error: "🚫",
    warning: "⚠️",
    info: "ℹ️",
    success: "✅",
};

const AUTO_DISMISS_MS = 6000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`toast ${toast.type}`}
            role="alert"
            onClick={() => onDismiss(toast.id)}
        >
            <span className="toast-icon">{ICONS[toast.type]}</span>
            <div className="toast-body">
                <p className="toast-title">{toast.title}</p>
                <p className="toast-msg">{toast.message}</p>
            </div>
            <button
                className="toast-close"
                onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
}

export default function ErrorToast({ toasts, onDismiss }: ToastProps) {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container" role="region" aria-label="Notifications">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}
