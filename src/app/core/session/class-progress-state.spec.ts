import { classProgress, completionId, progressLabel } from './class-progress-state';

const START = 1_000;

describe('classProgress', () => {
  const machines = [
    { machine: 'a', at: START + 1 },
    { machine: 'b', at: START + 2 },
    { machine: 'c', at: START + 3 },
  ];

  it('conta quem concluiu a fase sobre quem esta presente', () => {
    const result = classProgress(
      machines,
      [
        { levelId: 1, machine: 'a', at: START + 10 },
        { levelId: 1, machine: 'b', at: START + 11 },
        { levelId: 2, machine: 'c', at: START + 12 },
      ],
      1,
      START,
    );

    expect(result).toEqual({ done: 2, total: 3, ratio: 2 / 3, complete: false });
  });

  it('fica completo quando todos os presentes concluem', () => {
    const completions = machines.map((m) => ({ levelId: 1, machine: m.machine, at: START + 20 }));
    expect(classProgress(machines, completions, 1, START).complete).toBeTrue();
  });

  it('ignora presenca e conclusao de uma aula anterior', () => {
    const result = classProgress(
      [...machines, { machine: 'velha', at: START - 1 }],
      [
        { levelId: 1, machine: 'a', at: START - 5 },
        { levelId: 1, machine: 'velha', at: START + 5 },
      ],
      1,
      START,
    );

    expect(result.total).toBe(3);
    expect(result.done).toBe(0);
  });

  it('conta uma maquina uma vez so, mesmo com conclusao repetida', () => {
    const result = classProgress(
      machines,
      [
        { levelId: 1, machine: 'a', at: START + 1 },
        { levelId: 1, machine: 'a', at: START + 2 },
      ],
      1,
      START,
    );

    expect(result.done).toBe(1);
  });

  it('sem alunos, nunca esta completo', () => {
    expect(classProgress([], [], 1, START)).toEqual({
      done: 0,
      total: 0,
      ratio: 0,
      complete: false,
    });
  });
});

describe('completionId', () => {
  it('junta maquina e fase', () => {
    expect(completionId('abc', 2)).toBe('abc-2');
  });
});

describe('progressLabel', () => {
  it('fala de quantos terminaram, no singular e no plural', () => {
    expect(progressLabel({ done: 0, total: 0, ratio: 0, complete: false })).toBe(
      'Nenhum aluno conectado ainda',
    );
    expect(progressLabel({ done: 1, total: 1, ratio: 1, complete: true })).toBe(
      '1 de 1 aluno terminou',
    );
    expect(progressLabel({ done: 7, total: 12, ratio: 7 / 12, complete: false })).toBe(
      '7 de 12 alunos terminaram',
    );
  });
});
