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
  /** Como a sugestao aparece na lista — no HTML, ja com os sinais da tag. */
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

/** O que aceitar a sugestao faz, antes de virar posicoes absolutas. */
interface PlannedEdit {
  readonly label: string;
  readonly insert: string;
  readonly from: number;
  /** Onde o cursor para, contado a partir de `from`. */
  readonly caretOffset: number;
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

  return vocabularyFor(file)
    .filter((entry) => {
      const label = entry.label.toLowerCase();
      return label.startsWith(typed) && label !== typed;
    })
    .map((entry) => {
      const edit: PlannedEdit =
        file === 'html'
          ? tagEdit(entry.label, text, start, caret)
          : {
              label: entry.label,
              insert: entry.insert,
              caretOffset: entry.caretOffset ?? entry.insert.length,
              from: start,
            };

      return {
        label: edit.label,
        detail: entry.detail,
        kind: entry.kind,
        insert: edit.insert,
        from: edit.from,
        to: caret,
        caret: edit.from + edit.caretOffset,
      };
    });
}

/**
 * No HTML a sugestao e sempre uma tag inteira, com os sinais: quem esta
 * aprendendo digita `ball` sem o `<`, e aceitar so o nome deixava o codigo
 * quebrado do mesmo jeito.
 *
 * - `ba`   → `<ball></ball>`, cursor no meio (onde vai o que fica dentro)
 * - `<ba`  → idem, reaproveitando o `<` ja digitado
 * - `</ba` → `</ball>`, cursor depois do `>`
 *
 * Um `>` que ja esta logo depois do cursor e reaproveitado, nao duplicado.
 */
function tagEdit(
  name: string,
  text: string,
  start: number,
  caret: number,
): PlannedEdit {
  const hasGt = text[caret] === '>';

  if (text.slice(start - 2, start) === '</') {
    return {
      label: `</${name}>`,
      insert: hasGt ? name : `${name}>`,
      caretOffset: name.length + 1,
      from: start,
    };
  }

  const label = `<${name}>`;
  const from = text[start - 1] === '<' ? start - 1 : start;
  if (hasGt) {
    // `<ba|>`: o aluno esta corrigindo o nome de uma tag que ja existe.
    return { label, insert: `<${name}`, caretOffset: name.length + 2, from };
  }

  return { label, insert: `<${name}></${name}>`, caretOffset: name.length + 2, from };
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
