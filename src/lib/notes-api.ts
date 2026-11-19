import { supabase } from "@/lib/supabase";
import { clampToBoard } from "@/lib/board";
import { normalizeColor } from "@/lib/note-colors";
import type { Note, NoteDraft } from "@/types/note";

export const NOTE_LIMIT = 100;

interface NoteRow {
  id: string;
  text: string;
  author: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  created_at: string;
}

function toNote(row: NoteRow): Note {
  const { x, y } = clampToBoard(Number(row.x) || 0, Number(row.y) || 0);
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    x,
    y,
    rotation: Number(row.rotation) || 0,
    color: normalizeColor(row.color),
    createdAt: row.created_at,
  };
}

function client() {
  if (!supabase) throw new Error("The wall isn't connected to a database yet.");
  return supabase;
}

/** Supabase errors are plain objects, not Error instances. */
function fail(error: { message: string }): never {
  throw new Error(error.message);
}

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await client()
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(NOTE_LIMIT);
  if (error) fail(error);
  return (data as NoteRow[]).map(toNote);
}

export async function insertNote(draft: NoteDraft): Promise<Note> {
  const { data, error } = await client()
    .from("notes")
    .insert(draft)
    .select()
    .single();
  if (error) fail(error);
  return toNote(data as NoteRow);
}

export async function saveNotePosition(id: string, x: number, y: number) {
  const { error } = await client().from("notes").update({ x, y }).eq("id", id);
  if (error) fail(error);
}

export async function removeNote(id: string) {
  const { error } = await client().from("notes").delete().eq("id", id);
  if (error) fail(error);
}

export type RealtimeState = "live" | "offline";

interface Handlers {
  onInsert: (note: Note) => void;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onState: (state: RealtimeState) => void;
}

/** Subscribes to changes on the wall. Returns an unsubscribe function. */
export function subscribeToNotes(handlers: Handlers): () => void {
  const db = client();
  const channel = db
    .channel("notes-wall")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notes" },
      (payload) => handlers.onInsert(toNote(payload.new as NoteRow)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notes" },
      (payload) => handlers.onUpdate(toNote(payload.new as NoteRow)),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "notes" },
      (payload) => handlers.onDelete((payload.old as { id: string }).id),
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") handlers.onState("live");
      else if (status !== "CLOSED") handlers.onState("offline");
    });

  return () => {
    db.removeChannel(channel);
  };
}
