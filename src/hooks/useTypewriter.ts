import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, baseSpeed: number = 10) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    let currentIndex = 0;
    setDisplayText('');

    const totalChars = text.length;
    // Adaptive step & interval to ensure streaming is snappy without being sluggish
    let step = 1;
    let intervalSpeed = baseSpeed;

    if (totalChars > 500) {
      step = 3;
      intervalSpeed = 8;
    } else if (totalChars > 250) {
      step = 2;
      intervalSpeed = 9;
    } else if (totalChars > 100) {
      step = 1;
      intervalSpeed = 10;
    } else {
      step = 1;
      intervalSpeed = 12;
    }

    const timer = setInterval(() => {
      if (currentIndex < totalChars) {
        currentIndex = Math.min(currentIndex + step, totalChars);
        setDisplayText(text.slice(0, currentIndex));
      } else {
        clearInterval(timer);
      }
    }, intervalSpeed);

    return () => clearInterval(timer);
  }, [text, baseSpeed]);

  return displayText;
};
