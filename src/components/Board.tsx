"use client";

import { useRef, type RefObject } from "react";
import StickyNote from "@/components/StickyNote";
import { BOARD_HEIGHT, BOARD_WIDTH } from "@/lib/board";
import type { Note } from "@/types/note";

interface BoardProps {
  notes: Note[];
  viewportRef: RefObject<HTMLDivElement | null>;
  highlightId: string | null;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

/** A pannable cork wall. Touch pans natively; the mouse can grab the background. */
export default function Board({
  notes,
  viewportRef,
  highlightId,
  onMove,
  onDelete,
}: BoardProps) {
  const pan = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || e.pointerType !== "mouse" || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".sticky-note")) return;

    viewport.setPointerCapture(e.pointerId);
    viewport.style.cursor = "grabbing";
    pan.current = {
      x: e.clientX,
      y: e.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!pan.current || !viewport) return;
    viewport.scrollLeft = pan.current.left - (e.clientX - pan.current.x);
    viewport.scrollTop = pan.current.top - (e.clientY - pan.current.y);
  }

  function handlePointerEnd() {
    pan.current = null;
    if (viewportRef.current) viewportRef.current.style.cursor = "";
  }

  // Newest first in state; render oldest first so the newest sits on top.
  const ordered = [...notes].reverse();

  return (
    <div
      ref={viewportRef}
      className="board-viewport absolute inset-0 overflow-auto"
      style={{ cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        className="board-surface relative"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        {ordered.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            highlighted={note.id === highlightId}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
