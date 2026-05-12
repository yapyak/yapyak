import {
  type Highlighter,
  type BundledLanguage,
  createHighlighter,
} from 'shiki';

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter === null) {
    highlighter = await createHighlighter({
      themes: ['vesper'],
      langs: ['tsx', 'ts', 'jsx', 'js', 'bash', 'json', 'css', 'svelte', 'vue'],
    });
  }
  return highlighter;
}

export async function highlight(
  code: string,
  lang: BundledLanguage = 'tsx',
): Promise<string> {
  const instance = await getHighlighter();
  return instance.codeToHtml(code, {
    lang,
    theme: 'vesper',
  });
}
