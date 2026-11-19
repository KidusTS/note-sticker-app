"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  NOTE_LIMIT,
  fetchNotes,
  insertNote,
  removeNote,
  saveNotePosition,
  subscribeToNotes,
} from "@/lib/notes-api";
import type { Note, NoteDraft } from "@/types/note";

export type ConnectionStatus =
  | "connecting"
  | "live"
  | "offline"
  | "unconfigured";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

/** The shared wall: loads notes, keeps them in sync in real time, and exposes optimistic actions. */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured ? "connecting" : "unconfigured",
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState<string | null>(null);

  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  /** Ids this client is currently saving, so stale echoes don't fight local state. */
  const saving = useRef(new Set<string>());
  const hasBeenOffline = useRef(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setNotes(await fetchNotes());
    } catch (err) {
      setLoadError(errorMessage(err, "Couldn't load the wall."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void load();

    return subscribeToNotes({
      onInsert: (note) =>
        setNotes((prev) =>
          prev.some((n) => n.id === note.id)
            ? prev
            : [note, ...prev].slice(0, NOTE_LIMIT),
        ),
      onUpdate: (note) => {
        if (saving.current.has(note.id)) return;
        setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
      },
      onDelete: (id) => setNotes((prev) => prev.filter((n) => n.id !== id)),
      onState: (state) => {
        setStatus(state);
        if (state === "offline") hasBeenOffline.current = true;
        // Anything could have changed while we were away.
        if (state === "live" && hasBeenOffline.current) {
          hasBeenOffline.current = false;
          void load();
        }
      },
    });
  }, [load]);

  const reload = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  const addNote = useCallback(async (draft: NoteDraft) => {
    const note = await insertNote(draft);
    setNotes((prev) =>
      prev.some((n) => n.id === note.id)
        ? prev
        : [note, ...prev].slice(0, NOTE_LIMIT),
    );
    return note;
  }, []);

  const moveNote = useCallback(async (id: string, x: number, y: number) => {
    const before = notesRef.current.find((n) => n.id === id);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    saving.current.add(id);
    try {
      await saveNotePosition(id, x, y);
    } catch (err) {
      if (before) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, x: before.x, y: before.y } : n,
          ),
        );
      }
      throw new Error(errorMessage(err, "Couldn't save the new position."));
    } finally {
      saving.current.delete(id);
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const before = notesRef.current;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await removeNote(id);
    } catch (err) {
      setNotes(before);
      throw new Error(errorMessage(err, "Couldn't delete that note."));
    }
  }, []);

  return {
    notes,
    status,
    loading,
    loadError,
    reload,
    addNote,
    moveNote,
    deleteNote,
  };
}
