import { Filter } from "bad-words";

const AMHARIC_WORDS = [
  "ወሬ", "ዘርጣ", "ቆማጣ", "ዝሽ", "ጭራሽ", "ደደብ", "ሞኝ", "ባለጌ",
  "ዘንጋ", "ቆሻሻ", "ዘረኛ", "ጨካኝ", "ሰይጣን", "እርኩስ",
  "ዝንጀሮ", "አህያ", "ውሻ", "ድመት", "ፈረስ", "በሬ", "ላም", "ፍየል",
  "ሽንት", "ቅማል", "ደም", "ሞት", "ግድያ", "ጥላቻ", "ክፋት",
];

let filter: Filter | null = null;

/** English (bad-words) plus the Amharic list above. */
export function containsProfanity(text: string): boolean {
  if (!filter) {
    filter = new Filter();
    filter.addWords(...AMHARIC_WORDS);
  }
  return filter.isProfane(text);
}
