import { t } from 'yapyak';

interface GreetingProps {
  name: string;
}

export function Greeting({ name }: GreetingProps): JSX.Element {
  return (
    <article>
      <header>
        <h1>{t('Hello')}</h1>
      </header>
      <section>
        <p>{t('Hi {name}', { name })}</p>
        <button type="button">{t('Save')}</button>
      </section>
    </article>
  );
}
