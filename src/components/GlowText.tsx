import React from 'react';

export interface GlowTextProps {
  text: string;
  delay?: number;
  className?: string;
  id?: string;
}

/**
 * GlowText Component
 * Splits the incoming string into individual characters and animates each with a staggered
 * neon cyan glow-in effect via animationDelay: `${index * delay}s`.
 */
export const GlowText: React.FC<GlowTextProps> = ({
  text,
  delay = 0.04,
  className = '',
  id,
}) => {
  if (!text) return null;

  // Split by newlines first to preserve intentional line breaks
  const lines = text.split('\n');
  let globalCharIndex = 0;

  return (
    <span id={id} className={`inline-block ${className}`}>
      {lines.map((line, lineIndex) => {
        const words = line.split(' ');
        return (
          <React.Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            <span className="inline">
              {words.map((word, wordIndex) => {
                const characters = Array.from(word);
                return (
                  <span key={wordIndex} className="inline-block whitespace-nowrap">
                    {characters.map((char) => {
                      const currentIndex = globalCharIndex++;
                      return (
                        <span
                          key={currentIndex}
                          className="animate-glow-in inline-block"
                          style={{
                            animationDelay: `${currentIndex * delay}s`,
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                    {/* Render preserved space between words */}
                    {wordIndex < words.length - 1 && (
                      <span
                        key={`space-${wordIndex}`}
                        className="animate-glow-in inline-block"
                        style={{
                          animationDelay: `${globalCharIndex++ * delay}s`,
                        }}
                      >
                        {'\u00A0'}
                      </span>
                    )}
                  </span>
                );
              })}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default GlowText;
