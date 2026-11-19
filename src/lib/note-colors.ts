export const NOTE_COLORS = [
  "yellow",
  "peach",
  "sky",
  "mint",
  "lilac",
  "rose",
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

export const COLOR_LABELS: Record<NoteColor, string> = {
  yellow: "Yellow",
  peach: "Peach",
  sky: "Sky",
  mint: "Mint",
  lilac: "Lilac",
  rose: "Rose",
};

/**
 * Older notes stored a Tailwind class string (e.g. "bg-blue-200/90 border-…")
 * in the `color` column. Map those onto the current palette.
 */
const LEGACY_HUES: Array<[RegExp, NoteColor]> = [
  [/yellow|amber/, "yellow"],
  [/orange/, "peach"],
  [/blue|cyan/, "sky"],
  [/green|lime/, "mint"],
  [/purple/, "lilac"],
  [/rose/, "rose"],
];

export function normalizeColor(raw: string | null | undefined): NoteColor {
  if (!raw) return "yellow";
  if ((NOTE_COLORS as readonly string[]).includes(raw)) return raw as NoteColor;
  const match = LEGACY_HUES.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : "yellow";
}

export function randomColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}
