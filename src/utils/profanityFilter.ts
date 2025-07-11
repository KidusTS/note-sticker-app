// Simple profanity filter - you can enhance this with a more comprehensive list
const profanityWords = [
  // English profanity (basic list)
  'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'crap', 'idiot',
  // Add more words as needed
  
  // Amharic profanity (basic list)
  'ወሬ', 'ዘርጣ', 'ቆማጣ', 
  // Add more Amharic words as needed
];

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word.toLowerCase()));
}

export function cleanText(text: string): string {
  let cleanedText = text;
  
  profanityWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
  });
  
  return cleanedText.trim();
}

// Additional text cleaning functions
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateTextLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

export function validateAuthorName(name: string): boolean {
  // Allow letters, numbers, spaces, and common punctuation
  const validNameRegex = /^[a-zA-Z0-9\s\u1200-\u137F._-]+$/;
  return validNameRegex.test(name) && name.length >= 1 && name.length <= 50;
}

export function validateNoteText(text: string): boolean {
  // Basic validation for note text
  return text.length >= 1 && text.length <= 200;
}