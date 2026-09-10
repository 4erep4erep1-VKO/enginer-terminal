/**
 * Voice Input Normalizer & Deduplicator
 * Cleans speech recognition transcripts from stutters, repeated words, and intermediate echo phrases.
 */

/**
 * Strips stutter prefixes, consecutive duplicate words, and repeated phrases.
 * Example:
 *  "поменял поменял масло" -> "Поменял масло"
 *  "замена масла замена масла" -> "Замена масла"
 *  "масло и фильтр, масло и фильтр" -> "Масло и фильтр"
 */
export function normalizeVoiceTranscript(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  if (!text) return '';

  // 1. Remove stutter hyphens: "по-поменял" -> "поменял", "м-масло" -> "масло"
  text = text.replace(/([\p{L}]+)-\1/giu, '$1');
  text = text.replace(/\b([\p{L}])-(?=\1[\p{L}]+)/giu, '');

  // 2. Remove duplicate adjacent phrases (from 8 words down to 2 words)
  // e.g. "поменял масло и фильтр поменял масло и фильтр"
  for (let phraseLen = 8; phraseLen >= 2; phraseLen--) {
    const words = text.split(/\s+/);
    if (words.length >= phraseLen * 2) {
      const cleanWords: string[] = [];
      let i = 0;
      let modified = false;

      while (i < words.length) {
        if (i + phraseLen * 2 <= words.length) {
          const p1 = words.slice(i, i + phraseLen)
            .map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''))
            .filter(Boolean)
            .join(' ');
          const p2 = words.slice(i + phraseLen, i + phraseLen * 2)
            .map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''))
            .filter(Boolean)
            .join(' ');

          if (p1 && p1 === p2) {
            // Keep first instance
            for (let k = 0; k < phraseLen; k++) {
              cleanWords.push(words[i + k]);
            }
            i += phraseLen * 2;
            modified = true;
            continue;
          }
        }
        cleanWords.push(words[i]);
        i++;
      }

      if (modified) {
        text = cleanWords.join(' ');
      }
    }
  }

  // 3. Remove consecutive duplicate words / tokens (case-insensitive)
  // e.g. "масло масло", "поменял, поменял", "заменил... заменил"
  const tokens = text.split(/\s+/);
  const outTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentClean = tokens[i].toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const prevClean = outTokens.length > 0 
      ? outTokens[outTokens.length - 1].toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') 
      : '';
    if (currentClean && currentClean === prevClean) {
      continue;
    }
    outTokens.push(tokens[i]);
  }
  text = outTokens.join(' ');

  // 4. Clean up multiple spaces, punctuation spacing
  text = text
    .replace(/\s*([,.:;!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing commas, semicolons or colons
  text = text.replace(/[,;:]+$/, '').trim();

  // 5. Capitalize first letter
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}

/**
 * Extracts accumulated final results from SpeechRecognitionEvent to avoid intermediate echo.
 * Only processes final results (isFinal) to eliminate speech engine self-overlap.
 */
export function extractFinalSpeechTranscript(eventResults: any): string {
  if (!eventResults || typeof eventResults.length !== 'number') return '';

  let finalTranscript = '';
  let fallbackTranscript = '';

  for (let i = 0; i < eventResults.length; i++) {
    const item = eventResults[i];
    const text = item && item[0] ? item[0].transcript : '';
    if (item && item.isFinal) {
      finalTranscript += (finalTranscript ? ' ' : '') + text;
    } else if (text) {
      fallbackTranscript = text;
    }
  }

  // Prefer final transcripts if available, else use fallback
  const raw = (finalTranscript.trim() || fallbackTranscript.trim());
  return normalizeVoiceTranscript(raw);
}
