import { useState, useEffect } from 'react';

export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check if the device supports touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(hasTouch);

    // Listen for touch events to detect touch capability
    const handleTouchStart = () => {
      setIsTouch(true);
    };

    // Add event listener
    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return isTouch;
}
