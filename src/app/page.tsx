"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Note } from "@/types/note";
import {
  generateRandomPosition,
  generateRandomRotation,
  getRandomColor,
  clearOccupiedPositions,
  redistributeNotes,
  updateNotePosition,
  removeNotePosition,
} from "@/utils/noteUtils";
import { containsProfanity, cleanText } from "@/utils/profanityFilter";
import { supabase, isSupabaseConfigured, type NewNote } from "@/lib/supabase";
import NoteCard from "@/components/NoteCard";
import {
  Send,
  AlertCircle,
  Heart,
  RefreshCw,
  Loader2,
  Moon,
  Wifi,
  WifiOff,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const pendingUpdates = useRef<Set<string>>(new Set()); // Track pending position updates

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle container resize - only redistribute if dimensions actually changed significantly
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        const newHeight = containerRef.current.offsetHeight;

        const widthDiff = Math.abs(newWidth - containerDimensions.width);
        const heightDiff = Math.abs(newHeight - containerDimensions.height);

        if (widthDiff > 50 || heightDiff > 50) {
          setContainerDimensions({ width: newWidth, height: newHeight });

          // Only redistribute if it's a significant change and not initial load
          if (
            notes.length > 0 &&
            !isInitialLoad.current &&
            (widthDiff > 100 || heightDiff > 100)
          ) {
            // console.log(
            //   "📐 Container resized significantly, redistributing notes..."
            // );
            const redistributedNotes = redistributeNotes(
              notes,
              newWidth,
              newHeight
            );
            setNotes(redistributedNotes);
          }
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [notes, containerDimensions]);

  // Check scroll buttons visibility
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Handle scroll
  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = isMobile ? 200 : 300;
      const newScrollLeft =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Improved note movement handler - now returns a Promise
  const handleNoteMove = useCallback(
    async (id: string, x: number, y: number): Promise<void> => {
      // console.log("📍 Moving note:", id, "to position:", { x, y });

      // Prevent duplicate updates
      if (pendingUpdates.current.has(id)) {
        // console.log("⏳ Update already pending for note:", id);
        return;
      }

      // Update local state immediately for smooth UX
      setNotes((prevNotes) => {
        const updatedNotes = prevNotes.map((note) =>
          note.id === id ? { ...note, x, y } : note
        );

        // Update position tracking
        const isMobile = containerDimensions.width < 768;
        const cardWidth = isMobile ? 160 : 200;
        const cardHeight = isMobile ? 120 : 140;
        updateNotePosition(id, x, y, cardWidth, cardHeight);

        return updatedNotes;
      });

      // Update database if connected
      if (
        isSupabaseConfigured &&
        supabase &&
        connectionStatus === "connected"
      ) {
        try {
          pendingUpdates.current.add(id);

          const { error } = await supabase
            .from("notes")
            .update({ x, y })
            .eq("id", id);

          if (error) {
            console.error("❌ Error updating note position:", error);
            setError("Failed to save note position. Please try again.");
            setTimeout(() => setError(""), 3000);
            throw error; // Re-throw to let the component handle the error
          } else {
            // console.log("✅ Note position saved successfully");
          }
        } catch (error) {
          console.error("❌ Error updating note position:", error);
          setError("Failed to save note position.");
          setTimeout(() => setError(""), 3000);
          throw error; // Re-throw to let the component handle the error
        } finally {
          pendingUpdates.current.delete(id);
        }
      } else {
        // console.log(
        //   "⚠️ Not connected to database, position only saved locally"
        // );
        // Simulate a small delay even for local-only updates
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    },
    [connectionStatus, containerDimensions.width]
  );

  // Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setConnectionStatus("disconnected");
        setError(
          "Supabase is not configured. Please check your environment variables."
        );
        setIsLoading(false);
        return;
      }

      try {
        const { error } = await supabase
          .from("notes")
          .select("count", { count: "exact", head: true });

        if (error) {
          console.error("Supabase connection error:", error);
          setConnectionStatus("disconnected");
          setError(`Database connection failed: ${error.message}`);
        } else {
          setConnectionStatus("connected");
          // console.log("✅ Supabase connected successfully");
        }
      } catch (err) {
        console.error("Connection test failed:", err);
        setConnectionStatus("disconnected");
        setError(
          "Failed to connect to database. Please check your configuration."
        );
      }
    };

    checkConnection();
  }, []);

  // Load notes from Supabase
  const loadNotes = useCallback(async () => {
    if (
      !isSupabaseConfigured ||
      !supabase ||
      connectionStatus !== "connected"
    ) {
      setIsLoading(false);
      return;
    }

    try {
      // console.log("🔄 Loading notes from Supabase...");

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("❌ Error loading notes:", error);
        throw error;
      }

      // console.log("✅ Notes loaded successfully:", data?.length || 0, "notes");

      // Set notes directly without redistribution on initial load
      if (data) {
        setNotes(data);

        // Update position tracking for loaded notes
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth;
          const containerHeight = containerRef.current.offsetHeight;
          const isMobile = containerWidth < 768;
          const cardWidth = isMobile ? 160 : 200;
          const cardHeight = isMobile ? 120 : 140;

          clearOccupiedPositions();
          data.forEach((note) => {
            updateNotePosition(note.id, note.x, note.y, cardWidth, cardHeight);
          });

          setContainerDimensions({
            width: containerWidth,
            height: containerHeight,
          });
        }
      }

      isInitialLoad.current = false;
      setError("");
    } catch (error) {
      console.error("❌ Error loading notes:", error);
      setError(
        `Failed to load notes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [connectionStatus]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (connectionStatus === "connected" && supabase) {
      loadNotes();

      // console.log("🔄 Setting up real-time subscription...");

      const channel = supabase
        .channel("notes-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notes",
          },
          (payload) => {
            // console.log("✅ New note received:", payload.new);
            const newNote = payload.new as Note;

            setNotes((prev: Note[]) => {
              if (prev.some((note) => note.id === newNote.id)) {
                return prev;
              }

              // Update position tracking for new note
              const isMobile = containerDimensions.width < 768;
              const cardWidth = isMobile ? 160 : 200;
              const cardHeight = isMobile ? 120 : 140;
              updateNotePosition(
                newNote.id,
                newNote.x,
                newNote.y,
                cardWidth,
                cardHeight
              );

              return [newNote, ...prev.slice(0, 99)];
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notes",
          },
          (payload) => {
            // console.log("🗑️ Note deleted:", payload.old);
            const deletedId = payload.old.id;

            setNotes((prev: Note[]) =>
              prev.filter((note) => note.id !== deletedId)
            );

            // Remove from position tracking
            removeNotePosition(deletedId);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notes",
          },
          (payload) => {
            // console.log("📝 Note updated:", payload.new);
            const updatedNote = payload.new as Note;

            // Only update if this update is not from our own pending update
            if (!pendingUpdates.current.has(updatedNote.id)) {
              setNotes((prev: Note[]) =>
                prev.map((note) =>
                  note.id === updatedNote.id ? updatedNote : note
                )
              );

              // Update position tracking
              const isMobile = containerDimensions.width < 768;
              const cardWidth = isMobile ? 160 : 200;
              const cardHeight = isMobile ? 120 : 140;
              updateNotePosition(
                updatedNote.id,
                updatedNote.x,
                updatedNote.y,
                cardWidth,
                cardHeight
              );
            }
          }
        )
        .subscribe((status) => {
          // console.log("📡 Subscription status:", status);
        });

      return () => {
        // console.log("🔌 Cleaning up subscription...");
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [loadNotes, connectionStatus, containerDimensions.width]);

  // Check scroll buttons when notes change
  useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 100);
    return () => clearTimeout(timer);
  }, [notes, checkScrollButtons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      // Rate limiting - prevent spam submissions
      const currentTime = Date.now();
      const timeSinceLastSubmission = currentTime - lastSubmissionTime;
      const minInterval = 5000; // 5 seconds between submissions

      if (timeSinceLastSubmission < minInterval) {
        const waitTime = Math.ceil(
          (minInterval - timeSinceLastSubmission) / 1000
        );
        setError(
          `Please wait ${waitTime} seconds before submitting another note.`
        );
        return;
      }

      // Validation
      if (!noteText.trim() || !author.trim()) {
        setError("Please fill in both the note and author fields.");
        return;
      }

      if (noteText.length > 200) {
        setError("Note is too long. Please keep it under 200 characters.");
        return;
      }

      if (author.length > 50) {
        setError(
          "Author name is too long. Please keep it under 50 characters."
        );
        return;
      }

      // Enhanced content validation
      const trimmedText = noteText.trim();
      const trimmedAuthor = author.trim();

      if (trimmedText.length < 3) {
        setError("Note must be at least 3 characters long.");
        return;
      }

      if (trimmedAuthor.length < 2) {
        setError("Author name must be at least 2 characters long.");
        return;
      }

      if (containsProfanity(trimmedText) || containsProfanity(trimmedAuthor)) {
        setError(
          "Your message contains inappropriate content. Please revise and try again."
        );
        return;
      }

      // Check connection
      if (!isSupabaseConfigured || !supabase) {
        setError(
          "Database is not configured. Please contact the administrator."
        );
        return;
      }

      if (connectionStatus !== "connected") {
        setError(
          "Not connected to database. Please refresh the page and try again."
        );
        return;
      }

      if (!containerRef.current) {
        setError("Unable to determine note position. Please try again.");
        return;
      }

      // Create note data
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const position = generateRandomPosition(containerWidth, containerHeight);

      const newNote: NewNote = {
        text: cleanText(trimmedText),
        author: cleanText(trimmedAuthor),
        x: position.x,
        y: position.y,
        rotation: generateRandomRotation(),
        color: getRandomColor(),
      };

      // console.log("📝 Submitting note:", newNote);

      // Insert into Supabase
      const { data, error } = await supabase
        .from("notes")
        .insert([newNote])
        .select()
        .single();

      if (error) {
        console.error("❌ Error inserting note:", error);
        throw error;
      }

      // console.log("✅ Note inserted successfully:", data);

      // Update last submission time
      setLastSubmissionTime(currentTime);

      // Clear form
      setNoteText("");
      setAuthor("");
      setSuccess("Your note has been shared with everyone! ✨");

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("❌ Error submitting note:", error);
      setError(
        `Failed to post your note: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (
      !isSupabaseConfigured ||
      !supabase ||
      connectionStatus !== "connected"
    ) {
      setError("Cannot delete note: not connected to database.");
      return;
    }

    try {
      // console.log("🗑️ Deleting note:", id);

      const { error } = await supabase.from("notes").delete().eq("id", id);

      if (error) {
        console.error("❌ Error deleting note:", error);
        throw error;
      }

      // console.log("✅ Note deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting note:", error);
      setError(
        `Failed to delete note: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError("");
    clearOccupiedPositions();
    pendingUpdates.current.clear();
    isInitialLoad.current = true;
    loadNotes();
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 
                      flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto mb-4 text-purple-400"
            size={isMobile ? 36 : 48}
          />
          <p className={`text-gray-300 ${isMobile ? "text-base" : "text-lg"}`}>
            {connectionStatus === "connecting"
              ? "Connecting to database..."
              : "Loading notes..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Moon className="text-purple-400" size={isMobile ? 20 : 28} />
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              Note Stickers
            </h1>
            <Heart className="text-pink-400" size={isMobile ? 20 : 28} />
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed px-2 sm:px-4">
            Share your thoughts, quotes, and inspiration with the world! Write a
            note and watch it appear as a beautiful sticky note on our global
            wall.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            All notes are moderated for appropriate content in English and
            Amharic.
            <span className="text-purple-300">
              {" "}
              • Click the move icon to reposition notes!
            </span>
          </p>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full">
              {notes.length} notes shared globally
            </span>

            {/* Connection Status */}
            <div
              className={`inline-flex items-center gap-1 text-xs sm:text-sm px-3 py-1 rounded-full
                           ${
                             connectionStatus === "connected"
                               ? "text-green-400 bg-green-900/30"
                               : "text-red-400 bg-red-900/30"
                           }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <Wifi size={12} />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  Disconnected
                </>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={connectionStatus !== "connected"}
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-purple-400 
                         hover:text-purple-300 transition-colors duration-200 
                         bg-gray-700/50 hover:bg-gray-700 px-3 py-1 rounded-full
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionStatus === "disconnected" && (
        <div className="bg-red-900/50 border-b border-red-700/50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">
                Database Connection Error
              </p>
              <p className="text-red-400 text-xs">
                Unable to connect to the database. Notes cannot be saved or
                loaded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes Display Area with Horizontal Scroll */}
      <div className="relative mx-2 sm:mx-3 md:mx-4 lg:mx-6 my-3 sm:my-4 md:my-6 lg:my-8">
        {/* Scroll Buttons */}
        {(canScrollLeft || canScrollRight) && (
          <>
            {canScrollLeft && (
              <button
                onClick={() => handleScroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 
                           bg-gray-800/90 hover:bg-gray-700 text-white p-2 rounded-full
                           shadow-lg hover:shadow-xl transition-all duration-200
                           backdrop-blur-sm border border-gray-600"
                aria-label="Scroll left"
              >
                <ArrowLeft size={isMobile ? 16 : 20} />
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => handleScroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 
                           bg-gray-800/90 hover:bg-gray-700 text-white p-2 rounded-full
                           shadow-lg hover:shadow-xl transition-all duration-200
                           backdrop-blur-sm border border-gray-600"
                aria-label="Scroll right"
              >
                <ArrowRight size={isMobile ? 16 : 20} />
              </button>
            )}
          </>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-600 
                     scrollbar-track-gray-800/50 hover:scrollbar-thumb-gray-500"
          onScroll={checkScrollButtons}
        >
          {/* Notes Container */}
          <main
            ref={containerRef}
            className="relative bg-gray-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl 
                       border border-gray-600/50 shadow-2xl overflow-hidden"
            style={{
              minHeight: isMobile ? "300px" : "400px",
              height: isMobile ? "40vh" : "55vh",
              minWidth: "100%",
              width:
                notes.length > 10
                  ? `${Math.max(1200, notes.length * 60)}px`
                  : "100%",
              position: "relative",
            }}
          >
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center text-gray-400">
                  <Heart
                    size={isMobile ? 28 : 40}
                    className="mx-auto mb-3 text-gray-500"
                  />
                  <p
                    className={`font-medium mb-2 text-gray-300 ${
                      isMobile ? "text-base" : "text-lg"
                    }`}
                  >
                    {connectionStatus === "connected"
                      ? "No notes yet!"
                      : "Unable to load notes"}
                  </p>
                  <p
                    className={`text-gray-400 ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {connectionStatus === "connected"
                      ? "Be the first to share your thoughts with the world."
                      : "Please check your connection and try refreshing the page."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={handleDeleteNote}
                    onMove={handleNoteMove}
                    isMobile={isMobile}
                    containerRef={
                      containerRef as React.RefObject<HTMLDivElement>
                    }
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Scroll Hint */}
        {notes.length > 8 && !isMobile && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <div
              className="bg-gray-800/90 text-gray-300 text-xs px-3 py-1 rounded-full
                            backdrop-blur-sm border border-gray-600/50 animate-pulse"
            >
              ← Scroll to see more notes • Click move icon to reposition →
            </div>
          </div>
        )}
      </div>

      {/* Footer - Input Area */}
      <footer className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 shadow-2xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-2">
                Share Your Note
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-300">
                Write something inspiring, funny, or thoughtful!
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="bg-red-900/50 border border-red-700/50 rounded-lg p-3 sm:p-4 
                              flex items-start gap-2 sm:gap-3 animate-fade-in"
              >
                <AlertCircle
                  className="text-red-400 flex-shrink-0 mt-0.5"
                  size={isMobile ? 16 : 20}
                />
                <p className="text-red-300 text-xs sm:text-sm leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/50 border border-green-700/50 rounded-lg p-3 sm:p-4 animate-fade-in">
                <p className="text-green-300 text-xs sm:text-sm text-center">
                  {success}
                </p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Author Input */}
              <div className="space-y-2">
                <label
                  htmlFor="author"
                  className="block text-xs sm:text-sm font-medium text-gray-300"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 
                           rounded-lg text-white placeholder-gray-400 text-sm sm:text-base
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all duration-200 backdrop-blur-sm"
                  maxLength={50}
                  disabled={connectionStatus !== "connected"}
                />
                <p className="text-xs text-gray-400">
                  {author.length}/50 characters
                </p>
              </div>

              {/* Note Text Input */}
              <div className="space-y-2">
                <label
                  htmlFor="noteText"
                  className="block text-xs sm:text-sm font-medium text-gray-300"
                >
                  Your Note ({noteText.length}/200)
                </label>
                <textarea
                  id="noteText"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write your note here..."
                  rows={isMobile ? 3 : 4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 
                           rounded-lg text-white placeholder-gray-400 text-sm sm:text-base
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all duration-200 resize-none backdrop-blur-sm"
                  maxLength={200}
                  disabled={connectionStatus !== "connected"}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Max 200 characters</span>
                  <span
                    className={noteText.length > 180 ? "text-yellow-400" : ""}
                  >
                    {200 - noteText.length} remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={
                  !noteText.trim() ||
                  !author.trim() ||
                  isSubmitting ||
                  connectionStatus !== "connected"
                }
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 
                         bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                         font-medium rounded-lg text-sm sm:text-base
                         hover:from-purple-700 hover:to-pink-700 
                         focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800
                         transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         disabled:hover:from-purple-600 disabled:hover:to-pink-700
                         shadow-lg hover:shadow-xl transform hover:scale-105
                         disabled:transform-none disabled:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={isMobile ? 16 : 18}
                    />
                    Posting...
                  </>
                ) : connectionStatus !== "connected" ? (
                  <>
                    <WifiOff size={isMobile ? 16 : 18} />
                    Disconnected
                  </>
                ) : (
                  <>
                    <Send size={isMobile ? 16 : 18} />
                    Post Note
                  </>
                )}
              </button>
            </div>

            {/* Mobile-specific tips */}
            {isMobile && (
              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                <p className="text-xs text-gray-400 text-center">
                  💡 Tip: Tap the move icon (↗️) on notes to reposition them •
                  Swipe left/right to see more notes
                </p>
              </div>
            )}

            {/* Desktop tips */}
            {!isMobile && (
              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                <p className="text-xs text-gray-400 text-center">
                  💡 Tip: Click the move icon (↗️) on notes to enter move mode,
                  then click anywhere to reposition
                </p>
              </div>
            )}
          </form>
        </div>
      </footer>
    </div>
  );
}
