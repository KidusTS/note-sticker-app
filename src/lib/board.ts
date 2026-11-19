/**
 * The wall is a fixed-size canvas that people pan around. Because its size
 * never depends on the window, a note's stored (x, y) means the same thing on
 * every device and nothing has to be re-laid-out on resize.
 */
export const BOARD_WIDTH = 2400;
export const BOARD_HEIGHT = 1400;

export const NOTE_WIDTH = 176;
/** Typical rendered height; used for spacing, not for layout. */
export const NOTE_HEIGHT = 140;

const MARGIN = 16;

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function clampToBoard(x: number, y: number) {
  return {
    x: clamp(x, MARGIN, BOARD_WIDTH - NOTE_WIDTH - MARGIN),
    y: clamp(y, MARGIN, BOARD_HEIGHT - NOTE_HEIGHT - MARGIN),
  };
}

export function randomRotation() {
  return Math.round((Math.random() - 0.5) * 12 * 10) / 10;
}

/**
 * Pick a spot for a new note inside the part of the wall the person is
 * currently looking at, as far away from existing notes as a handful of random
 * candidates allows.
 */
export function pickSpot(
  existing: ReadonlyArray<{ x: number; y: number }>,
  view: Rect,
  candidates = 30,
) {
  const minX = view.left + MARGIN;
  const minY = view.top + MARGIN;
  const spanX = Math.max(view.width - NOTE_WIDTH - MARGIN * 2, 0);
  const spanY = Math.max(view.height - NOTE_HEIGHT - MARGIN * 2, 0);

  let best = clampToBoard(minX, minY);
  let bestScore = -1;

  for (let i = 0; i < candidates; i++) {
    const spot = clampToBoard(
      minX + Math.random() * spanX,
      minY + Math.random() * spanY,
    );
    const nearest = existing.reduce(
      (min, note) =>
        Math.min(min, (note.x - spot.x) ** 2 + (note.y - spot.y) ** 2),
      Infinity,
    );
    if (nearest > bestScore) {
      best = spot;
      bestScore = nearest;
    }
  }

  return { x: Math.round(best.x), y: Math.round(best.y) };
}
