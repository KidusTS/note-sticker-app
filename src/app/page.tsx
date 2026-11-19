"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import Board from "@/components/Board";
import ComposeDialog, { type ComposeValues } from "@/components/ComposeDialog";
import Header from "@/components/Header";
import Toasts from "@/components/Toasts";
import { useNotes } from "@/hooks/useNotes";
import { useToasts } from "@/hooks/useToasts";
import { BOARD_HEIGHT, BOARD_WIDTH, pickSpot, randomRotation } from "@/lib/board";

const POST_COOLDOWN_MS = 5000;
const HIGHLIGHT_MS = 2200;

export default function Home() {
  const {
    notes,
    status,
    loading,
    loadError,
    reload,
    addNote,
    moveNote,
    deleteNote,
  } = useNotes();
  const { toasts, notify } = useToasts();

  const viewportRef = useRef<HTMLDivElement>(null);
  const lastPostAt = useRef(0);
  const [composing, setComposing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const handleCompose = useCallback(
    async ({ author, text, color }: ComposeValues) => {
      const wait = POST_COOLDOWN_MS - (Date.now() - lastPostAt.current);
      if (wait > 0) {
        throw new Error(
          `Easy there — you can pin another note in ${Math.ceil(wait / 1000)}s.`,
        );
      }

      // Drop the note into the part of the wall the person is looking at.
      const viewport = viewportRef.current;
      const view = viewport
        ? {
            left: viewport.scrollLeft,
            top: viewport.scrollTop,
            width: viewport.clientWidth,
            height: viewport.clientHeight,
          }
        : { left: 0, top: 0, width: BOARD_WIDTH, height: BOARD_HEIGHT };
      const { x, y } = pickSpot(notes, view);

      const note = await addNote({
        author,
        text,
        color,
        x,
        y,
        rotation: randomRotation(),
      });

      lastPostAt.current = Date.now();
      setHighlightId(note.id);
      setComposing(false);
      notify("success", "Pinned to the wall.");
    },
    [notes, addNote, notify],
  );

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      moveNote(id, x, y).catch((err: Error) => notify("error", err.message));
    },
    [moveNote, notify],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNote(id).catch((err: Error) => notify("error", err.message));
    },
    [deleteNote, notify],
  );

  const canPost = status === "live";
  const problem =
    status === "unconfigured"
      ? "This wall isn't connected to a database yet. Add your Supabase URL and anon key to .env.local."
      : loadError
        ? `Couldn't load the wall: ${loadError}`
        : status === "offline"
          ? "Connection lost. Reconnecting automatically — new notes will appear when it's back."
          : null;

  return (
    <div className="flex h-dvh flex-col">
      <Header status={status} noteCount={notes.length} />

      {problem && (
        <div
          role="alert"
          className="flex shrink-0 items-center gap-3 border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger sm:px-6"
        >
          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
          <p className="flex-1">{problem}</p>
          {status !== "unconfigured" && (
            <button
              onClick={reload}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-danger/40 px-3 py-1 font-medium hover:bg-danger/10"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      )}

      <main className="relative min-h-0 flex-1">
        <Board
          notes={notes}
          viewportRef={viewportRef}
          highlightId={highlightId}
          onMove={handleMove}
          onDelete={handleDelete}
        />

        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-3 rounded-full bg-surface px-5 py-3 shadow-lg">
              <Loader2 className="animate-spin text-accent" size={20} aria-hidden="true" />
              Loading the wall…
            </div>
          </div>
        )}

        {!loading && notes.length === 0 && canPost && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
            <div className="rounded-2xl bg-surface/95 px-8 py-6 text-center shadow-xl">
              <p className="font-hand text-4xl">The wall is empty.</p>
              <p className="mt-1 text-ink-soft">Be the first to pin something.</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setComposing(true)}
          disabled={!canPost}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 inline-flex h-14 items-center gap-2
                     rounded-full bg-accent pl-5 pr-6 text-base font-semibold text-accent-ink shadow-xl
                     transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <Plus size={22} aria-hidden="true" />
          New note
        </button>
      </main>

      <ComposeDialog
        open={composing}
        onClose={() => setComposing(false)}
        onSubmit={handleCompose}
      />
      <Toasts toasts={toasts} />
    </div>
  );
}
