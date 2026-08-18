import { t } from 'yapyak';

export function Greeting() {
  return (
    <p>
      {t('Hello')}
      {t('Hi {name}', {
        name: 'World',
      })}
      {t.as('button', 'Open')}
    </p>
  );
}
