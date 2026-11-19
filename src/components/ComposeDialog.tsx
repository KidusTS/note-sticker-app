"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import NotePaper from "@/components/NotePaper";
import {
  COLOR_LABELS,
  NOTE_COLORS,
  randomColor,
  type NoteColor,
} from "@/lib/note-colors";
import { readStorage, writeStorage } from "@/lib/storage";
import { LIMITS, validateDraft } from "@/lib/validation";

const AUTHOR_KEY = "note-stickers:author";

export interface ComposeValues {
  author: string;
  text: string;
  color: NoteColor;
}

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  /** Resolve to close the dialog; throw to show the message inline. */
  onSubmit: (values: ComposeValues) => Promise<void>;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/70 " +
  "focus-visible:outline-2 focus-visible:outline-accent";

export default function ComposeDialog({
  open,
  onClose,
  onSubmit,
}: ComposeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [color, setColor] = useState<NoteColor>("yellow");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const remembered = readStorage(AUTHOR_KEY) ?? "";
      setAuthor((current) => current || remembered);
      setColor(randomColor());
      setError(null);
      dialog.showModal();
      const hasName = Boolean(authorRef.current?.value || remembered);
      (hasName ? textRef : authorRef).current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const problem = await validateDraft(author, text);
      if (problem) {
        setError(problem);
        return;
      }
      const name = author.trim();
      await onSubmit({ author: name, text: text.trim(), color });
      writeStorage(AUTHOR_KEY, name);
      setText("");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't post your note. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = LIMITS.textMax - text.length;

  return (
    <dialog
      ref={dialogRef}
      className="compose"
      aria-labelledby="compose-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="compose-title" className="text-xl font-semibold">
              Pin a note
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Everyone who visits the wall will see it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-line/60"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mx-auto w-44 pt-2" aria-hidden="true">
          <div style={{ rotate: "-2deg" }} className="relative">
            <NotePaper
              text={text.trim() || "Your note will look like this"}
              author={author.trim() || "You"}
              color={color}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="note-text" className="mb-1.5 flex justify-between text-sm font-medium">
              <span>Note</span>
              <span
                className={remaining < 20 ? "text-danger" : "text-ink-soft"}
                aria-live="polite"
              >
                {remaining} left
              </span>
            </label>
            <textarea
              id="note-text"
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Something kind, funny or true…"
              rows={3}
              maxLength={LIMITS.textMax}
              className={`${field} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="note-author" className="mb-1.5 block text-sm font-medium">
              Your name
            </label>
            <input
              id="note-author"
              ref={authorRef}
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="How should we sign it?"
              maxLength={LIMITS.authorMax}
              autoComplete="nickname"
              className={field}
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Colour</legend>
            <div className="flex gap-2.5">
              {NOTE_COLORS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="note-color"
                    value={c}
                    checked={color === c}
                    onChange={() => setColor(c)}
                    className="peer sr-only"
                  />
                  <span
                    title={COLOR_LABELS[c]}
                    className="block size-9 rounded-full border border-black/10 shadow-sm transition-transform
                               peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2
                               peer-checked:ring-offset-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                    style={{ background: `var(--note-${c})` }}
                  />
                  <span className="sr-only">{COLOR_LABELS[c]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-ink-soft">
            Moderated in English and Amharic.
          </p>
          <button
            type="submit"
            disabled={submitting || !text.trim() || !author.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-ink
                       transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            {submitting ? "Pinning…" : "Pin it"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
