import { Flash } from '#components/flash';
import { useFlashContext } from '#systems/flash';

export function RootFlashView() {
  const { entry } = useFlashContext();

  if (entry === null) {
    return null;
  }

  return (
    <Flash
      accent={entry.accent}
      key={entry.id}
    />
  );
}
