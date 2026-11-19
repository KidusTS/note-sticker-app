import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { Toast } from "@/hooks/useToasts";

export default function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className="toast-in pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm shadow-lg"
        >
          {t.kind === "error" ? (
            <AlertCircle size={18} className="shrink-0 text-danger" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" aria-hidden="true" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
