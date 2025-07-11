import { Note } from '@/types/note';

// Realistic dull note colors that look like real sticky notes
const realisticNoteColors = [
  'bg-yellow-300/90 border-yellow-400/70 shadow-yellow-500/20', // Classic yellow sticky note
  'bg-orange-200/90 border-orange-300/70 shadow-orange-400/20', // Peach/orange
  'bg-blue-200/90 border-blue-300/70 shadow-blue-400/20',       // Light blue
  'bg-green-200/90 border-green-300/70 shadow-green-400/20',    // Light green
  'bg-purple-200/90 border-purple-300/70 shadow-purple-400/20', // Light purple
  'bg-amber-200/90 border-amber-300/70 shadow-amber-400/20',    // Amber
  'bg-lime-200/90 border-lime-300/70 shadow-lime-400/20',       // Light lime
  'bg-cyan-200/90 border-cyan-300/70 shadow-cyan-400/20',       // Light cyan
  'bg-rose-200/90 border-rose-300/70 shadow-rose-400/20',       // Light rose
];

// Store occupied positions to prevent overlapping
let occupiedPositions: Array<{ 
  id: string; 
  x: number; 
  y: number; 
  width: number; 
  height: number 
}> = [];

// Clear occupied positions (call this when loading new notes)
export function clearOccupiedPositions() {
  occupiedPositions = [];
  // console.log('🧹 Cleared occupied positions');
}

// Update a note's position in the tracking system
export function updateNotePosition(id: string, x: number, y: number, width: number, height: number) {
  const existingIndex = occupiedPositions.findIndex(pos => pos.id === id);
  
  if (existingIndex >= 0) {
    occupiedPositions[existingIndex] = { id, x, y, width, height };
  } else {
    occupiedPositions.push({ id, x, y, width, height });
  }
}

// Remove a note from position tracking
export function removeNotePosition(id: string) {
  occupiedPositions = occupiedPositions.filter(pos => pos.id !== id);
  // console.log('🗑️ Removed position tracking for note:', id);
}

// Check if a position overlaps with existing notes (excluding a specific note)
function isPositionOccupied(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  excludeId?: string,
  padding: number = 20
): boolean {
  return occupiedPositions.some(pos => {
    if (excludeId && pos.id === excludeId) return false;
    
    return !(
      x > pos.x + pos.width + padding ||
      x + width + padding < pos.x ||
      y > pos.y + pos.height + padding ||
      y + height + padding < pos.y
    );
  });
}

// Check if a position is within container bounds
export function isWithinBounds(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  containerWidth: number, 
  containerHeight: number,
  padding: number = 10
): boolean {
  return (
    x >= padding &&
    y >= padding &&
    x + width <= containerWidth - padding &&
    y + height <= containerHeight - padding
  );
}

// Add position to occupied list
function addOccupiedPosition(id: string, x: number, y: number, width: number, height: number) {
  occupiedPositions.push({ id, x, y, width, height });
}

export function generateRandomPosition(containerWidth: number, containerHeight: number, excludeId?: string) {
  const isMobile = containerWidth < 768;
  const cardWidth = isMobile ? 160 : 200;
  const cardHeight = isMobile ? 120 : 140;
  const padding = isMobile ? 15 : 25;
  
  const maxX = Math.max(containerWidth - cardWidth - padding, 0);
  const maxY = Math.max(containerHeight - cardHeight - padding, 0);
  
  let attempts = 0;
  const maxAttempts = 30; // Reduced attempts for better performance
  
  while (attempts < maxAttempts) {
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    
    if (!isPositionOccupied(x, y, cardWidth, cardHeight, excludeId)) {
      return { x, y };
    }
    
    attempts++;
  }
  
  // If we can't find a non-overlapping position, place it anyway
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  
  return { x, y };
}

// Generate positions for existing notes (when loading from database)
export function generatePositionForExistingNote(
  note: Note, 
  containerWidth: number, 
  containerHeight: number
) {
  const isMobile = containerWidth < 768;
  const cardWidth = isMobile ? 160 : 200;
  const cardHeight = isMobile ? 120 : 140;
  
  // If note already has valid position, use it
  if (note.x >= 0 && note.y >= 0 && 
      isWithinBounds(note.x, note.y, cardWidth, cardHeight, containerWidth, containerHeight)) {
    
    // Always use the existing position from database
    addOccupiedPosition(note.id, note.x, note.y, cardWidth, cardHeight);
    return { x: note.x, y: note.y };
  }
  
  // Generate new position if original is invalid
  const newPosition = generateRandomPosition(containerWidth, containerHeight, note.id);
  addOccupiedPosition(note.id, newPosition.x, newPosition.y, cardWidth, cardHeight);
  return newPosition;
}

export function generateRandomRotation(): number {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (Math.random() - 0.5) * (isMobile ? 12 : 15); // Subtle rotation
}

export function getRandomColor(): string {
  return realisticNoteColors[Math.floor(Math.random() * realisticNoteColors.length)];
}

export function createNote(
  text: string, 
  author: string, 
  containerWidth: number, 
  containerHeight: number
): Omit<Note, 'id' | 'created_at'> {
  const position = generateRandomPosition(containerWidth, containerHeight);
  
  return {
    text,
    author,
    x: position.x,
    y: position.y,
    rotation: generateRandomRotation(),
    color: getRandomColor(),
    createdAt: new Date(),
  };
}

// Simplified redistribution - only when absolutely necessary
export function redistributeNotes(notes: Note[], containerWidth: number, containerHeight: number): Note[] {
  // console.log('🔄 Redistributing', notes.length, 'notes for container:', { containerWidth, containerHeight });
  clearOccupiedPositions();
  
  return notes.map((note) => {
    const newPosition = generatePositionForExistingNote(note, containerWidth, containerHeight);
    return {
      ...note,
      x: newPosition.x,
      y: newPosition.y,
    };
  });
}
