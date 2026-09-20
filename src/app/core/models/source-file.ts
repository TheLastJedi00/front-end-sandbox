/** Os tres arquivos que o aluno edita — um por linguagem. */
export type SourceFileId = 'html' | 'css' | 'js';

export interface SourceFile {
  readonly id: SourceFileId;
  /** Nome exibido na aba, como num editor de verdade. */
  readonly name: string;
  readonly language: 'HTML' | 'CSS' | 'JavaScript';
}

export type SourceCode = Record<SourceFileId, string>;

export const SOURCE_FILES: readonly SourceFile[] = [
  { id: 'html', name: 'index.html', language: 'HTML' },
  { id: 'css', name: 'style.css', language: 'CSS' },
  { id: 'js', name: 'script.js', language: 'JavaScript' },
] as const;

export function emptySourceCode(): SourceCode {
  return { html: '', css: '', js: '' };
}
