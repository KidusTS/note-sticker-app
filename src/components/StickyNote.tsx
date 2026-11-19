"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import NotePaper from "@/components/NotePaper";
import { clampToBoard } from "@/lib/board";
import type { Note } from "@/types/note";

interface StickyNoteProps {
  note: Note;
  highlighted: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

const DRAG_THRESHOLD = 4;
const KEY_SAVE_DELAY = 500;
const CONFIRM_WINDOW = 3000;

// Raised on every grab so the note you're holding is always on top.
let topLayer = 1;

interface Gesture {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

function StickyNote({ note, highlighted, onMove, onDelete }: StickyNoteProps) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [layer, setLayer] = useState(0);
  const [armed, setArmed] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const x = drag?.x ?? note.x;
  const y = drag?.y ?? note.y;

  // Two-step delete: first press arms it, second press confirms.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), CONFIRM_WINDOW);
    return () => clearTimeout(timer);
  }, [armed]);

  useEffect(() => () => clearTimeout(keyTimer.current), []);

  const bringToFront = () => setLayer(++topLayer);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    // On touch only the tape drags, so the note body can still pan the wall.
    const onHandle = (e.target as HTMLElement).closest("[data-drag-handle]");
    if (e.pointerType === "touch" && !onHandle) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: x,
      originY: y,
      moved: false,
    };
    bringToFront();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    g.moved = true;
    setDrag(clampToBoard(g.originX + dx, g.originY + dy));
  }

  function handlePointerEnd() {
    const g = gesture.current;
    gesture.current = null;
    if (g?.moved && drag) {
      onMove(note.id, Math.round(drag.x), Math.round(drag.y));
    }
    setDrag(null);
  }

  // Keyboard: arrows nudge (Shift = bigger steps); the save is debounced.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? 50 : 10;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[e.key];
    if (!move) return;

    e.preventDefault();
    bringToFront();
    const next = clampToBoard(x + move[0], y + move[1]);
    setDrag(next);
    clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => {
      onMove(note.id, Math.round(next.x), Math.round(next.y));
      setDrag(null);
    }, KEY_SAVE_DELAY);
  }

  function handleRemove() {
    if (armed) onDelete(note.id);
    else setArmed(true);
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`Note by ${note.author}: ${note.text}. Arrow keys move it.`}
      data-dragging={drag ? "" : undefined}
      className="sticky-note"
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${note.rotation}deg)`,
        zIndex: drag ? 100000 : layer || 1,
        touchAction: "pan-x pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      onFocus={bringToFront}
    >
      <div className={highlighted ? "note-pop" : undefined}>
        <NotePaper text={note.text} author={note.author} color={note.color} />
        <div data-drag-handle className="tape-handle" aria-hidden="true">
          <div className="tape" />
        </div>
        <button
          type="button"
          className="note-remove"
          data-armed={armed ? "" : undefined}
          onClick={handleRemove}
          onBlur={() => setArmed(false)}
          aria-label={
            armed ? "Confirm delete" : `Delete note by ${note.author}`
          }
        >
          {armed ? (
            <>
              <Trash2 size={13} aria-hidden="true" /> Delete?
            </>
          ) : (
            <X size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(StickyNote);
