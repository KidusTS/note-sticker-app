import { Filter } from 'bad-words';

// Create filter instance
const filter = new Filter();

// Add your custom Amharic words
const customAmharicWords = [
  // Amharic profanity (expanded)
  'ወሬ', 'ዘርጣ', 'ቆማጣ', 'ዝሽ', 'ጭራሽ', 'ደደብ', 'ሞኝ', 'ባለጌ',
  'ዘንጋ', 'ቆሻሻ', 'ዘረኛ', 'ጨካኝ', 'ሰይጣን', 'እርኩስ', 'ቆሻሻ',
  'ዝንጀሮ', 'አህያ', 'ውሻ', 'ድመት', 'ፈረስ', 'በሬ', 'ላም', 'ፍየል',
  'ሽንት', 'ቅማል', 'ደም', 'ሞት', 'ግድያ', 'ጥላቻ', 'ክፋት'
];

// Add custom words to the filter
filter.addWords(...customAmharicWords);

export function containsProfanity(text: string): boolean {
  return filter.isProfane(text);
}

export function cleanText(text: string): string {
  return filter.clean(text).trim();
}

// Keep your existing utility functions
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateTextLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

export function validateAuthorName(name: string): boolean {
  const validNameRegex = /^[a-zA-Z0-9\s\u1200-\u137F._-]+$/;
  return validNameRegex.test(name) && name.length >= 1 && name.length <= 50;
}

export function validateNoteText(text: string): boolean {
  return text.length >= 1 && text.length <= 200;
}
