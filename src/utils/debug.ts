export const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log(`🐛 [DEBUG] ${message}`, data || '');
  }
};

export const debugError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    // console.error(`❌ [ERROR] ${message}`, error || '');
  }
};

export const debugSuccess = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log(`✅ [SUCCESS] ${message}`, data || '');
  }
};