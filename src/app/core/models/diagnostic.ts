import { SourceFileId } from './source-file';

export type DiagnosticSeverity = 'erro' | 'aviso';

/**
 * Mensagem de um parser para o painel de problemas. A linguagem e deliberadamente
 * simples: quem le e um aluno vendo codigo pela primeira vez.
 */
export interface Diagnostic {
  readonly file: SourceFileId;
  readonly line: number;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
}

export function diagnostic(
  file: SourceFileId,
  line: number,
  message: string,
  severity: DiagnosticSeverity = 'erro',
): Diagnostic {
  return { file, line, message, severity };
}
