"use client";

import { useState, memo, useRef, useCallback, useEffect } from "react";
import { Note } from "@/types/note";
import { X, User, Move, Check } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  isMobile?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const NoteCard = memo(function NoteCard({
  note,
  onDelete,
  onMove,
  isMobile = false,
  containerRef,
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const containerClickListenerRef = useRef<((e: MouseEvent) => void) | null>(
    null
  );

  // Update position when note prop changes (only if not in move mode or dragging)
  useEffect(() => {
    if (!isDragging && !isMoveMode) {
      setPosition({ x: note.x, y: note.y });
    }
  }, [note.x, note.y, isDragging, isMoveMode]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this note?")) {
      onDelete(note.id);
    }
  };

  const getContainerBounds = useCallback(() => {
    if (!containerRef?.current) return null;
    return containerRef.current.getBoundingClientRect();
  }, [containerRef]);

  const getBoundedPosition = useCallback(
    (x: number, y: number) => {
      const containerBounds = getContainerBounds();
      if (!containerBounds) return { x, y };

      const cardWidth = isMobile ? 160 : 200;
      const cardHeight = isMobile ? 120 : 140;
      const padding = 10;

      const boundedX = Math.max(
        padding,
        Math.min(x, containerBounds.width - cardWidth - padding)
      );
      const boundedY = Math.max(
        padding,
        Math.min(y, containerBounds.height - cardHeight - padding)
      );

      return { x: boundedX, y: boundedY };
    },
    [isMobile, getContainerBounds]
  );

  // Exit move mode and save position
  const exitMoveMode = useCallback(() => {
    // console.log("🏁 Exiting move mode for note:", note.id);
    setIsMoveMode(false);

    // Remove container click listener
    if (containerClickListenerRef.current && containerRef?.current) {
      containerRef.current.removeEventListener(
        "click",
        containerClickListenerRef.current
      );
      containerRef.current.style.cursor = "";
      containerClickListenerRef.current = null;
    }

    // Save position if it changed
    if (onMove && (position.x !== note.x || position.y !== note.y)) {
      // console.log("💾 Saving final position:", position);
      onMove(note.id, position.x, position.y);
    }
  }, [position, note.id, note.x, note.y, onMove, containerRef]);

  // Handle move mode toggle
  const handleMoveToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isMoveMode) {
        exitMoveMode();
      } else {
        // Enter move mode
        setIsMoveMode(true);
        // console.log("🎯 Entering move mode for note:", note.id);

        // Add container click listener
        if (containerRef?.current) {
          const handleContainerClick = (e: MouseEvent) => {
            // Don't move if clicking on this note or its buttons
            const target = e.target as HTMLElement;
            if (target.closest(`[data-note-id="${note.id}"]`)) {
              return;
            }

            const containerBounds =
              containerRef.current!.getBoundingClientRect();
            const clickX = e.clientX - containerBounds.left;
            const clickY = e.clientY - containerBounds.top;

            // Adjust for note center
            const cardWidth = isMobile ? 160 : 200;
            const cardHeight = isMobile ? 120 : 140;
            const newX = clickX - cardWidth / 2;
            const newY = clickY - cardHeight / 2;

            const boundedPosition = getBoundedPosition(newX, newY);
            setPosition(boundedPosition);

            // console.log("📍 Moving note to clicked position:", boundedPosition);
          };

          containerClickListenerRef.current = handleContainerClick;
          containerRef.current.addEventListener("click", handleContainerClick);
          containerRef.current.style.cursor = "crosshair";
        }
      }
    },
    [
      isMoveMode,
      exitMoveMode,
      note.id,
      containerRef,
      isMobile,
      getBoundedPosition,
    ]
  );

  // Cleanup on unmount or when exiting move mode
  useEffect(() => {
    return () => {
      if (containerClickListenerRef.current && containerRef?.current) {
        containerRef.current.removeEventListener(
          "click",
          containerClickListenerRef.current
        );
        containerRef.current.style.cursor = "";
      }
    };
  }, [containerRef]);

  // Auto-exit move mode when clicking outside (escape hatch)
  useEffect(() => {
    if (isMoveMode) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          exitMoveMode();
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        // Copy containerRef.current to avoid stale closure
        const container = containerRef?.current;
        if (container && !container.contains(e.target as Node)) {
          exitMoveMode();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isMoveMode, exitMoveMode, containerRef]);

  // Traditional drag functionality (as fallback)
  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (isMoveMode) return false; // Don't drag in move mode

      const containerBounds = getContainerBounds();
      if (!containerBounds) return false;

      setIsDragging(true);
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        noteX: position.x,
        noteY: position.y,
      };

      if (noteRef.current) {
        noteRef.current.classList.add("dragging");
      }

      return true;
    },
    [position, getContainerBounds, isMoveMode]
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || isMoveMode) return;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.noteX + deltaX;
      const newY = dragStartRef.current.noteY + deltaY;

      const boundedPosition = getBoundedPosition(newX, newY);
      setPosition(boundedPosition);
    },
    [isDragging, isMoveMode, getBoundedPosition]
  );

  const endDrag = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    if (noteRef.current) {
      noteRef.current.classList.remove("dragging");
    }

    // Save position if it changed significantly
    const deltaX = Math.abs(position.x - note.x);
    const deltaY = Math.abs(position.y - note.y);

    if ((deltaX > 5 || deltaY > 5) && onMove) {
      // console.log("💾 Saving dragged position:", position);
      onMove(note.id, position.x, position.y);
    }
  }, [isDragging, position, note.id, note.x, note.y, onMove]);

  // Mouse events for traditional drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMoveMode) return; // Don't handle mouse down in move mode
      if ((e.target as HTMLElement).closest("button")) return;

      e.preventDefault();
      e.stopPropagation();

      if (startDrag(e.clientX, e.clientY)) {
        const handleMouseMove = (e: MouseEvent) => {
          e.preventDefault();
          updateDrag(e.clientX, e.clientY);
        };

        const handleMouseUp = (e: MouseEvent) => {
          e.preventDefault();
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          endDrag();
        };

        document.addEventListener("mousemove", handleMouseMove, {
          passive: false,
        });
        document.addEventListener("mouseup", handleMouseUp, { passive: false });
      }
    },
    [startDrag, updateDrag, endDrag, isMoveMode]
  );

  // Touch events for traditional drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isMoveMode) return; // Don't handle touch in move mode
      if ((e.target as HTMLElement).closest("button")) return;

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      if (startDrag(touch.clientX, touch.clientY)) {
        const handleTouchMove = (e: TouchEvent) => {
          e.preventDefault();
          const touch = e.touches[0];
          if (touch) {
            updateDrag(touch.clientX, touch.clientY);
          }
        };

        const handleTouchEnd = (e: TouchEvent) => {
          e.preventDefault();
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
          endDrag();
        };

        document.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd, {
          passive: false,
        });
      }
    },
    [startDrag, updateDrag, endDrag, isMoveMode]
  );

  const noteStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `rotate(${note.rotation}deg)`,
    transformOrigin: "center center",
    zIndex: isDragging || isMoveMode ? 1000 : isHovered ? 20 : 10,
    cursor: isMoveMode ? "move" : isDragging ? "grabbing" : "grab",
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
    MozUserSelect: "none" as const,
    msUserSelect: "none" as const,
    transition: isDragging || isMoveMode ? "none" : "all 0.2s ease-out",
  };

  return (
    <div
      ref={noteRef}
      data-note-id={note.id} // Add data attribute for identification
      className={`absolute select-none transition-all duration-200 ease-out
                  ${isMobile ? "w-40 min-h-[120px]" : "w-48 min-h-[140px]"}
                  ${
                    isDragging || isMoveMode
                      ? "scale-105 shadow-2xl"
                      : isHovered
                      ? "scale-105"
                      : "scale-100"
                  }
                  note-card`}
      style={noteStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => !isMobile && !isDragging && setIsHovered(true)}
      onMouseLeave={() => !isMobile && !isDragging && setIsHovered(false)}
    >
      {/* Note Paper */}
      <div
        className={`relative p-3 sm:p-4 rounded-lg border-2 
                    ${note.color}
                    shadow-lg transition-all duration-300
                    ${
                      isDragging || isMoveMode
                        ? "shadow-2xl ring-2 ring-blue-400/50"
                        : isHovered
                        ? "shadow-xl"
                        : ""
                    }
                    before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br 
                    before:from-white/20 before:to-transparent before:pointer-events-none
                    after:absolute after:inset-0 after:rounded-lg after:shadow-inner 
                    after:pointer-events-none`}
      >
        {/* Move Button */}
        <button
          onClick={handleMoveToggle}
          className={`absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center
                      transition-all duration-200 z-30
                      ${
                        isMoveMode
                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg animate-pulse"
                          : "bg-gray-500/70 hover:bg-gray-600/80 text-white/80"
                      }
                      ${
                        isHovered || isMobile || isDragging || isMoveMode
                          ? "opacity-100"
                          : "opacity-0"
                      }
                      hover:scale-110`}
          aria-label={isMoveMode ? "Exit move mode" : "Enter move mode"}
          title={
            isMoveMode ? "Click to finish moving" : "Click to move this note"
          }
        >
          {isMoveMode ? (
            <Check size={isMobile ? 6 : 8} />
          ) : (
            <Move size={isMobile ? 6 : 8} />
          )}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={`absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 
                      text-white rounded-full flex items-center justify-center
                      shadow-lg hover:shadow-xl transition-all duration-200
                      ${
                        isHovered || isMobile || isDragging || isMoveMode
                          ? "opacity-100"
                          : "opacity-0"
                      }
                      hover:scale-110 z-30`}
          aria-label="Delete note"
        >
          <X size={12} />
        </button>

        {/* Note Content */}
        <div className="relative z-10 pointer-events-none">
          {/* Note Text */}
          <p
            className={`text-gray-800 font-medium leading-relaxed mb-3
                         ${isMobile ? "text-xs" : "text-sm"}
                         break-words hyphens-auto`}
          >
            {note.text}
          </p>

          {/* Author */}
          <div
            className={`flex items-center gap-1 text-gray-700
                          ${isMobile ? "text-xs" : "text-xs"}`}
          >
            <User size={isMobile ? 10 : 12} className="flex-shrink-0" />
            <span className="font-semibold truncate">{note.author}</span>
          </div>
        </div>

        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 rounded-lg opacity-20 pointer-events-none
                        bg-gradient-to-br from-transparent via-white/10 to-gray-900/5"
        />

        {/* Subtle paper lines effect */}
        <div className="absolute inset-0 rounded-lg pointer-events-none opacity-10">
          <div className="absolute top-8 left-3 right-3 h-px bg-gray-400" />
          <div className="absolute top-12 left-3 right-3 h-px bg-gray-400" />
          <div className="absolute top-16 left-3 right-3 h-px bg-gray-400" />
        </div>

        {/* Move mode indicator */}
        {isMoveMode && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-400/50 pointer-events-none animate-pulse">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Click anywhere to move here • Press ESC to cancel
            </div>
          </div>
        )}

        {/* Dragging indicator */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg border-2 border-green-400/50 pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
});

export default NoteCard;
