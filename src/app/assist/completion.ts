import { SourceFileId } from '../core/models';
import { CompletionKind, vocabularyFor } from './vocabulary';

/** Palavra em digitacao imediatamente antes do cursor. */
const WORD_BEFORE = /[@A-Za-z_-]+$/;
/** Tag recem fechada: `<ball>` com o cursor logo depois do `>`. */
const OPENED_TAG = /<([a-z]+)>$/;

export interface CompletionContext {
  readonly text: string;
  readonly caret: number;
  readonly file: SourceFileId;
}

export interface Completion {
  readonly label: string;
  readonly detail: string;
  readonly kind: CompletionKind;
  /** Texto que substitui o intervalo [from, to). */
  readonly insert: string;
  readonly from: number;
  readonly to: number;
  /** Posicao absoluta do cursor depois de aceitar. */
  readonly caret: number;
}

export interface TextEdit {
  readonly text: string;
  readonly caret: number;
}

export function wordBefore(text: string, caret: number): { word: string; start: number } {
  const match = WORD_BEFORE.exec(text.slice(0, caret));
  if (!match) return { word: '', start: caret };

  return { word: match[0], start: caret - match[0].length };
}

/**
 * Sugestoes para a palavra em digitacao. Sem palavra comecada nao ha sugestao:
 * uma lista que abre sozinha atrapalha quem esta olhando o resultado ao lado.
 */
export function completionsAt({ text, caret, file }: CompletionContext): readonly Completion[] {
  const { word, start } = wordBefore(text, caret);
  if (!word) return [];

  const typed = word.toLowerCase();
  const insideTag = file === 'html' && text[start - 1] === '<';

  return vocabularyFor(file)
    .filter((entry) => {
      const label = entry.label.toLowerCase();
      return label.startsWith(typed) && label !== typed;
    })
    .map((entry) => {
      // Dentro de `<`, completar a tag ja escreve o fechamento e deixa o cursor
      // no meio — e ali que o aluno vai escrever o que fica dentro dela.
      const insert = insideTag ? `${entry.label}></${entry.label}>` : entry.insert;
      const caretOffset = insideTag
        ? entry.label.length + 1
        : (entry.caretOffset ?? insert.length);

      return {
        label: entry.label,
        detail: entry.detail,
        kind: entry.kind,
        insert,
        from: start,
        to: caret,
        caret: start + caretOffset,
      };
    });
}

export function applyCompletion(text: string, completion: Completion): TextEdit {
  return {
    text: text.slice(0, completion.from) + completion.insert + text.slice(completion.to),
    caret: completion.caret,
  };
}

/**
 * Fechamento automatico, olhando o caractere que acabou de ser digitado:
 * `<ball>` ganha o seu `</ball>` e `{` ganha a chave de fechamento. O cursor
 * fica sempre antes do que foi acrescentado.
 */
export function autoClose({ text, caret, file }: CompletionContext): TextEdit | null {
  const before = text.slice(0, caret);
  const typed = before.at(-1);

  if (typed === '>' && file === 'html') {
    const match = OPENED_TAG.exec(before);
    if (!match) return null;

    const closing = `</${match[1]}>`;
    if (text.slice(caret).startsWith(closing)) return null;

    return { text: before + closing + text.slice(caret), caret };
  }

  if (typed === '{' && (file === 'css' || file === 'js')) {
    if (text[caret] === '}') return null;

    return { text: `${before}}${text.slice(caret)}`, caret };
  }

  return null;
}
