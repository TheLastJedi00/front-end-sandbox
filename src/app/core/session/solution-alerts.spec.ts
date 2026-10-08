import { AlertToast, MERGE_WINDOW_MS, mergeAlert, toastMessage } from './solution-alerts';

const T0 = 1_700_000_000_000;

describe('mergeAlert', () => {
  it('o primeiro alerta abre um popup', () => {
    const toasts = mergeAlert([], { levelId: 1, machine: 'a', at: T0 }, 1);
    expect(toasts).toEqual([{ id: 1, levelId: 1, machines: ['a'], lastAt: T0 }]);
  });

  it('alertas proximos da mesma fase viram um popup so, contando maquinas diferentes', () => {
    let toasts = mergeAlert([], { levelId: 1, machine: 'a', at: T0 }, 1);
    toasts = mergeAlert(toasts, { levelId: 1, machine: 'b', at: T0 + 2000 }, 2);
    toasts = mergeAlert(toasts, { levelId: 1, machine: 'a', at: T0 + 3000 }, 2);

    expect(toasts.length).toBe(1);
    expect(toasts[0].machines).toEqual(['a', 'b']);
    expect(toasts[0].lastAt).toBe(T0 + 3000);
  });

  it('outra fase, ou depois da janela, abre outro popup', () => {
    let toasts = mergeAlert([], { levelId: 1, machine: 'a', at: T0 }, 1);
    toasts = mergeAlert(toasts, { levelId: 2, machine: 'a', at: T0 + 1000 }, 2);
    toasts = mergeAlert(toasts, { levelId: 1, machine: 'c', at: T0 + MERGE_WINDOW_MS + 1 }, 3);

    expect(toasts.map((t) => t.id)).toEqual([1, 2, 3]);
  });
});

describe('toastMessage', () => {
  const toast = (machines: string[]): AlertToast => ({ id: 1, levelId: 2, machines, lastAt: T0 });

  it('uma maquina ou varias', () => {
    expect(toastMessage(toast(['a']))).toBe('Uma máquina mostrou a solução da fase 2.');
    expect(toastMessage(toast(['a', 'b', 'c']))).toBe('3 máquinas mostraram a solução da fase 2.');
  });
});
