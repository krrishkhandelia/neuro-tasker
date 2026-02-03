
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
};

export function scrubPII(text: string): { scrubbed: string; map: Record<string, string> } {
  const map: Record<string, string> = {};
  let scrubbed = text;
  let counter = 0;

  const replace = (pattern: RegExp, placeholderType: string) => {
    scrubbed = scrubbed.replace(pattern, (match) => {
      const key = `__${placeholderType}_${counter++}__`;
      map[key] = match; 
      return key; 
    });
  };

  replace(PII_PATTERNS.email, 'EMAIL');
  replace(PII_PATTERNS.phone, 'PHONE');
  
  return { scrubbed, map };
}

export function restorePII(text: string, map: Record<string, string>): string {
  let restored = text;
  Object.keys(map).forEach((key) => {
    restored = restored.replace(key, map[key]);
  });
  return restored;
}