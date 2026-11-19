import type { CSSProperties } from "react";
import type { NoteColor } from "@/lib/note-colors";

interface NotePaperProps {
  text: string;
  author: string;
  color: NoteColor;
}

/** The visual of a sticky note, shared by the wall and the compose preview. */
export default function NotePaper({ text, author, color }: NotePaperProps) {
  return (
    <div
      className="paper"
      style={{ "--note": `var(--note-${color})` } as CSSProperties}
    >
      <p className="paper-text">{text}</p>
      <p className="paper-author">— {author}</p>
    </div>
  );
}
