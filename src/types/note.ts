import type { NoteColor } from "@/lib/note-colors";

export interface Note {
  id: string;
  text: string;
  author: string;
  /** Top-left position on the board, in board pixels. */
  x: number;
  y: number;
  /** Degrees. */
  rotation: number;
  color: NoteColor;
  createdAt: string;
}

/** What the client decides when pinning a new note. */
export type NoteDraft = Pick<
  Note,
  "text" | "author" | "x" | "y" | "rotation" | "color"
>;
