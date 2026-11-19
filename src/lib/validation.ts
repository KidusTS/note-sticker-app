export const LIMITS = {
  textMin: 3,
  textMax: 200,
  authorMin: 2,
  authorMax: 50,
} as const;

/** Returns a human-readable problem, or null when the draft is fine. */
export async function validateDraft(
  author: string,
  text: string,
): Promise<string | null> {
  const name = author.trim();
  const body = text.trim();

  if (name.length < LIMITS.authorMin) {
    return `Your name needs at least ${LIMITS.authorMin} characters.`;
  }
  if (name.length > LIMITS.authorMax) {
    return `Your name can be at most ${LIMITS.authorMax} characters.`;
  }
  if (body.length < LIMITS.textMin) {
    return `Your note needs at least ${LIMITS.textMin} characters.`;
  }
  if (body.length > LIMITS.textMax) {
    return `Your note can be at most ${LIMITS.textMax} characters.`;
  }

  // Loaded on demand: the word list is the heaviest part of the bundle.
  const { containsProfanity } = await import("@/lib/moderation");
  if (containsProfanity(body) || containsProfanity(name)) {
    return "That contains language we don't allow on the wall. Please reword it.";
  }

  return null;
}
