"use client";

import { useState, memo, useRef, useCallback, useEffect } from "react";
import { Note } from "@/types/note";
import { X, User, Move } from "lucide-react";

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
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const hasMoved = useRef(false);

  // Update position when note prop changes (but not during drag)
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: note.x, y: note.y });
    }
  }, [note.x, note.y, isDragging]);

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

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      console.log(
        "🎯 Starting drag for note:",
        note.id,
        "at position:",
        position
      );

      const containerBounds = getContainerBounds();
      if (!containerBounds) {
        console.log("❌ No container bounds");
        return false;
      }

      setIsDragging(true);
      hasMoved.current = false;

      dragStartRef.current = {
        x: clientX,
        y: clientY,
        noteX: position.x,
        noteY: position.y,
      };

      // Add dragging class for visual feedback
      if (noteRef.current) {
        noteRef.current.classList.add("dragging");
      }

      console.log("✅ Drag started successfully");
      return true;
    },
    [position, getContainerBounds, note.id]
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const containerBounds = getContainerBounds();
      if (!containerBounds) return;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      // Mark as moved with any movement (reduced threshold for more responsive dragging)
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        hasMoved.current = true;
      }

      const newX = dragStartRef.current.noteX + deltaX;
      const newY = dragStartRef.current.noteY + deltaY;

      // Check bounds
      const cardWidth = isMobile ? 160 : 200;
      const cardHeight = isMobile ? 120 : 140;
      const padding = 10;

      const boundedX = Math.max(
        padding,
        Math.min(newX, containerBounds.width - cardWidth - padding)
      );
      const boundedY = Math.max(
        padding,
        Math.min(newY, containerBounds.height - cardHeight - padding)
      );

      setPosition({ x: boundedX, y: boundedY });
    },
    [isDragging, isMobile, getContainerBounds]
  );

  const endDrag = useCallback(() => {
    if (!isDragging) return;

    console.log(
      "🏁 Ending drag for note:",
      note.id,
      "moved:",
      hasMoved.current,
      "final position:",
      position
    );

    setIsDragging(false);

    // Remove dragging class
    if (noteRef.current) {
      noteRef.current.classList.remove("dragging");
    }

    // Only call onMove if the note actually moved significantly
    if (hasMoved.current && onMove) {
      console.log("💾 Saving new position:", position);
      onMove(note.id, position.x, position.y);
    } else {
      console.log("↩️ No significant movement, keeping original position");
      // Don't revert position here - let the parent component handle it
    }

    hasMoved.current = false;
  }, [isDragging, position, note.id, onMove]);

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      console.log("🖱️ Mouse down on note:", note.id);

      // Don't start drag if clicking on delete button
      if ((e.target as HTMLElement).closest("button")) {
        console.log("❌ Clicked on button, not starting drag");
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Start drag immediately on mouse down
      if (startDrag(e.clientX, e.clientY)) {
        const handleMouseMove = (e: MouseEvent) => {
          e.preventDefault();
          updateDrag(e.clientX, e.clientY);
        };

        const handleMouseUp = (e: MouseEvent) => {
          console.log("🖱️ Mouse up, ending drag");
          e.preventDefault();
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          endDrag();
        };

        document.addEventListener("mousemove", handleMouseMove, { passive: false });
        document.addEventListener("mouseup", handleMouseUp, { passive: false });
      }
    },
    [startDrag, updateDrag, endDrag, note.id]
  );

  // Touch events - Fixed to not use passive listeners
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      console.log("👆 Touch start on note:", note.id);

      // Don't start drag if touching delete button
      if ((e.target as HTMLElement).closest("button")) {
        console.log("❌ Touched button, not starting drag");
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      // Start drag immediately on touch start
      if (startDrag(touch.clientX, touch.clientY)) {
        const handleTouchMove = (e: TouchEvent) => {
          e.preventDefault();
          const touch = e.touches[0];
          if (touch) {
            updateDrag(touch.clientX, touch.clientY);
          }
        };

        const handleTouchEnd = (e: TouchEvent) => {
          console.log("👆 Touch end, ending drag");
          e.preventDefault();
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
          endDrag();
        };

        // Add explicit passive: false to ensure preventDefault works
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
      }
    },
    [startDrag, updateDrag, endDrag, note.id]
  );

  const noteStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `rotate(${note.rotation}deg)`,
    transformOrigin: "center center",
    zIndex: isDragging ? 1000 : isHovered ? 20 : 10,
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
    MozUserSelect: "none" as const,
    msUserSelect: "none" as const,
  };

  return (
    <div
      ref={noteRef}
      className={`absolute select-none transition-all duration-200 ease-out
                  ${isMobile ? "w-40 min-h-[120px]" : "w-48 min-h-[140px]"}
                  ${
                    isDragging
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
                      isDragging
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
        {/* Drag Handle */}
        <div
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-400/50 rounded-full
                      ${isHovered || isDragging ? "opacity-100" : "opacity-0"}
                      transition-opacity duration-200 pointer-events-none`}
        />

        {/* Move Icon */}
        <div
          className={`absolute top-1 left-1 text-gray-500/70 pointer-events-none
                      ${isHovered || isDragging ? "opacity-100" : "opacity-0"}
                      transition-opacity duration-200`}
        >
          <Move size={isMobile ? 12 : 14} />
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 
                      text-white rounded-full flex items-center justify-center
                      shadow-lg hover:shadow-xl transition-all duration-200
                      ${
                        isHovered || isMobile || isDragging
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

        {/* Dragging indicator */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-400/50 pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
});

export default NoteCard;
