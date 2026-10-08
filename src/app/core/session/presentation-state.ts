import { FIRST_LEVEL, LAST_LEVEL } from '../../levels/level-definitions';
import { DECK_START, DeckPosition } from '../../slides/deck-navigation';
import { IDLE_TIMER, PhaseTimer, PHASE_DURATION_MS } from './phase-timer';

/** Em que parte da aula a turma esta. */
export type Stage = 'abertura' | 'fase' | 'fim';

/**
 * O documento `sessoes/{uid}`: tudo que o apresentador decide e todas as
 * maquinas seguem. O codigo de cada aluno nao entra aqui — ele e local.
 */
export interface PresentationState {
  readonly stage: Stage;
  /** Fase atual; so vale quando `stage = 'fase'`. */
  readonly levelId: number;
  /** Slide e etapa do deck na tela: a abertura ou o conceito da fase. */
  readonly deck: DeckPosition;
  /** O mini-deck de conceito ainda esta por cima da IDE. */
  readonly conceptOpen: boolean;
  readonly timer: PhaseTimer;
  /**
   * Epoch ms do ultimo "Reiniciar apresentacao". Separa a aula de agora das
   * anteriores — os alertas de solucao mais antigos que isso sao ignorados.
   */
  readonly startedAt: number;
}

export function initialPresentation(now: number): PresentationState {
  return {
    stage: 'abertura',
    levelId: FIRST_LEVEL,
    deck: DECK_START,
    conceptOpen: true,
    timer: IDLE_TIMER,
    startedAt: now,
  };
}

type Fields = Record<string, unknown>;

function isObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null;
}

function wholeNumber(value: unknown, fallback: number, min = 0, max = Infinity): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(Math.trunc(value), min), max)
    : fallback;
}

function parseStage(value: unknown): Stage {
  return value === 'fase' || value === 'fim' ? value : 'abertura';
}

function parseDeck(value: unknown): DeckPosition {
  if (!isObject(value)) return DECK_START;
  return { slide: wholeNumber(value['slide'], 0), step: wholeNumber(value['step'], 0) };
}

function parseTimer(value: unknown): PhaseTimer {
  if (!isObject(value)) return IDLE_TIMER;

  const remainingMs = wholeNumber(value['remainingMs'], PHASE_DURATION_MS, 0, PHASE_DURATION_MS);
  const endsAt = typeof value['endsAt'] === 'number' ? value['endsAt'] : null;

  switch (value['status']) {
    case 'rodando':
      // Rodando sem saber quando acaba nao conta nada: fica como pausado.
      return endsAt === null
        ? { status: 'pausado', endsAt: null, remainingMs }
        : { status: 'rodando', endsAt, remainingMs };
    case 'pausado':
      return { status: 'pausado', endsAt: null, remainingMs };
    default:
      return IDLE_TIMER;
  }
}

/**
 * Le o documento como veio do Firestore. Documento ausente, campo faltando ou
 * de tipo errado vira o valor inicial daquele campo: uma sessao meio escrita
 * nunca quebra a tela de ninguem.
 */
export function parsePresentationState(data: unknown, now: number): PresentationState {
  const initial = initialPresentation(now);
  if (!isObject(data)) return initial;

  return {
    stage: parseStage(data['stage']),
    levelId: wholeNumber(data['levelId'], FIRST_LEVEL, FIRST_LEVEL, LAST_LEVEL),
    deck: parseDeck(data['deck']),
    conceptOpen: typeof data['conceptOpen'] === 'boolean' ? data['conceptOpen'] : true,
    timer: parseTimer(data['timer']),
    startedAt: wholeNumber(data['startedAt'], initial.startedAt),
  };
}

/** A rota que mostra o estado: e para la que as maquinas dos alunos vao. */
export function routeOf(state: PresentationState): string[] {
  switch (state.stage) {
    case 'fase':
      return ['/sandbox', String(state.levelId)];
    case 'fim':
      return ['/fim'];
    default:
      return ['/'];
  }
}
