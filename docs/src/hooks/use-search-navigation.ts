import { useNavigate } from '@tanstack/react-router';

export function useSearchNavigation() {
  const navigate = useNavigate();

  return (href: string) => {
    const hashIndex = href.indexOf('#');
    const pathname = hashIndex < 0 ? href : href.slice(0, hashIndex);
    const hash = hashIndex < 0 ? undefined : href.slice(hashIndex + 1);

    void navigate({
      hash,
      to: pathname,
    });
  };
}
