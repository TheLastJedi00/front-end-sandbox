const MACHINE_KEY = 'sandbox-front-end:v1:maquina';

/**
 * Id aleatorio desta maquina, criado uma vez e guardado no `localStorage`.
 * Todas as maquinas usam a mesma conta: e so isso que separa uma da outra para
 * contar alertas, presenca e conclusoes. Nao identifica o aluno.
 */
export function machineId(): string {
  try {
    const saved = localStorage.getItem(MACHINE_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(MACHINE_KEY, id);
    return id;
  } catch {
    return 'desconhecida';
  }
}
