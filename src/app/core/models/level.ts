import { SourceCode, SourceFileId } from './source-file';
import { LevelCheck } from './validation';

/** Ferramenta que a fase ensina — uma fase, uma ferramenta. */
export type LevelConcept = 'HTML' | 'CSS' | 'JavaScript';

export interface LevelDefinition {
  readonly id: number;
  /** Conceito que a fase apresenta — vira o rotulo da barra de progresso. */
  readonly concept: LevelConcept;
  readonly title: string;
  /** Enunciado curto, em uma frase. */
  readonly goal: string;
  /** Paragrafo que explica o conceito antes de o aluno digitar. */
  readonly briefing: string;
  /** Arquivos habilitados nesta fase; os demais ficam ocultos. */
  readonly enabledFiles: readonly SourceFileId[];
  /** Arquivo aberto ao entrar na fase. */
  readonly focusFile: SourceFileId;
  /** Codigo com que a fase comeca (inclui o que o aluno ja construiu antes). */
  readonly starter: SourceCode;
  /** Codigo de referencia, usado pelo botao "Mostrar solucao". */
  readonly solution: SourceCode;
  /** O preview responde ao teclado nesta fase. */
  readonly interactive: boolean;
  readonly checks: readonly LevelCheck[];
  readonly hints: readonly string[];
}
