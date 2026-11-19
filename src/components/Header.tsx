import { StickyNote } from "lucide-react";
import type { ConnectionStatus } from "@/hooks/useNotes";

const STATUS: Record<ConnectionStatus, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-emerald-500" },
  connecting: { label: "Connecting", dot: "bg-amber-500 animate-pulse" },
  offline: { label: "Offline", dot: "bg-danger" },
  unconfigured: { label: "Not set up", dot: "bg-danger" },
};

interface HeaderProps {
  status: ConnectionStatus;
  noteCount: number;
}

export default function Header({ status, noteCount }: HeaderProps) {
  const { label, dot } = STATUS[status];

  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
          <StickyNote size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="font-hand text-3xl leading-none">Note Stickers</h1>
          <p className="mt-0.5 hidden truncate text-xs text-ink-soft sm:block">
            One wall, everyone&rsquo;s thoughts. Drag the wall to look around.
          </p>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft"
        role="status"
      >
        <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
        {status === "live" && (
          <span className="text-ink-soft/80">
            · {noteCount} {noteCount === 1 ? "note" : "notes"}
          </span>
        )}
      </div>
    </header>
  );
}
