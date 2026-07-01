import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setIsMatching(media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMatching(event.matches);
    };

    media.addEventListener('change', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, [
    query,
  ]);

  return isMatching;
}
