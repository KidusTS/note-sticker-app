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

type Point = { x: number; y: number };

/**
 * Notes may overlap, but never three deep. Every note is treated as a
 * NOTE_WIDTH x NOTE_HEIGHT box, so three boxes share a point exactly when
 * their x positions all lie within a note's width and their y positions
 * within its height.
 */
export function wouldTripleStack(
  others: ReadonlyArray<Point>,
  x: number,
  y: number,
): boolean {
  const near = others.filter(
    (o) => Math.abs(o.x - x) < NOTE_WIDTH && Math.abs(o.y - y) < NOTE_HEIGHT,
  );
  for (let i = 0; i < near.length; i++) {
    for (let j = i + 1; j < near.length; j++) {
      const xs = [x, near[i].x, near[j].x];
      const ys = [y, near[i].y, near[j].y];
      if (
        Math.max(...xs) - Math.min(...xs) < NOTE_WIDTH &&
        Math.max(...ys) - Math.min(...ys) < NOTE_HEIGHT
      ) {
        return true;
      }
    }
  }
  return false;
}

/** The requested spot if it respects the stacking limit, else the closest one that does. */
export function resolveSpot(
  others: ReadonlyArray<Point>,
  x: number,
  y: number,
): Point {
  const wanted = clampToBoard(x, y);
  if (!wouldTripleStack(others, wanted.x, wanted.y)) return wanted;

  const STEP = 24;
  const DIRECTIONS = 16;
  for (let radius = STEP; radius <= 900; radius += STEP) {
    for (let k = 0; k < DIRECTIONS; k++) {
      const angle = (k / DIRECTIONS) * Math.PI * 2;
      const spot = clampToBoard(
        wanted.x + Math.cos(angle) * radius,
        wanted.y + Math.sin(angle) * radius,
      );
      if (!wouldTripleStack(others, spot.x, spot.y)) return spot;
    }
  }
  return wanted; // a completely full wall; nothing better exists
}

/**
 * Pick a spot for a new note inside the part of the wall the person is
 * currently looking at, as far from existing notes as a handful of random
 * candidates allows, never making a three-deep stack. If the view is too
 * crowded it falls back to the rest of the wall.
 */
export function pickSpot(
  existing: ReadonlyArray<Point>,
  view: Rect,
  candidates = 30,
): Point {
  const wholeBoard: Rect = {
    left: 0,
    top: 0,
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
  };

  // The whole wall is a long shot when the view is full, so try harder there.
  for (const [area, tries] of [
    [view, candidates],
    [wholeBoard, candidates * 10],
  ] as const) {
    const minX = area.left + MARGIN;
    const minY = area.top + MARGIN;
    const spanX = Math.max(area.width - NOTE_WIDTH - MARGIN * 2, 0);
    const spanY = Math.max(area.height - NOTE_HEIGHT - MARGIN * 2, 0);

    let best: Point | null = null;
    let bestScore = -1;

    for (let i = 0; i < tries; i++) {
      const spot = clampToBoard(
        minX + Math.random() * spanX,
        minY + Math.random() * spanY,
      );
      if (wouldTripleStack(existing, spot.x, spot.y)) continue;

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

    if (best) return { x: Math.round(best.x), y: Math.round(best.y) };
  }

  const fallback = resolveSpot(existing, view.left + MARGIN, view.top + MARGIN);
  return { x: Math.round(fallback.x), y: Math.round(fallback.y) };
}
