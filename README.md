# yapyak 🐃

> **Yap in English. Ship in everything.**
>
> i18n for AI-powered teams. Translations are side-effects.

yapyak co-locates your translations with your code and lets AI maintain them.

You write `t('Save changes')` in your component. Save. The AI of your choice (Anthropic, OpenAI, or anything you wire up) regenerates every locale in your voice — with the surrounding code as context — and HMR pushes the new copy live before you switch tabs.

No enterprise portal, no per-seat pricing, no vendor in your billing path. Bring your own key, own the whole loop.

The default language lives only in your code. There's no `en.json`. Other locales are derived from your source like compiled output — regenerated on save, never authored. Translations are side-effects.

What Tailwind did to CSS class names, yapyak does to translation keys: kills the naming meeting. The string in your editor is the string in your app.

It's also the shape AI thrives in. Everything's in one file — the source string, the surrounding code, the component name. Claude reads `t('Save changes')` and sees the meaning right there. No round-trip to figure out what `auth.error.invalid_2` actually says. Every agent in your editor pulls in the same direction.

It's a Vite plugin. MIT, BYO key, no telemetry.
