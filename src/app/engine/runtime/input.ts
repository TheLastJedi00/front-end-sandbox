/**
 * Teclas pressionadas no momento. O game loop le este conjunto a cada quadro,
 * em vez de reagir a eventos — assim "segurar a tecla" funciona naturalmente.
 */
export class PressedKeys {
  private readonly down = new Set<string>();

  press(key: string): void {
    this.down.add(key);
  }

  release(key: string): void {
    this.down.delete(key);
  }

  clear(): void {
    this.down.clear();
  }

  isDown(key: string): boolean {
    return this.down.has(key.toUpperCase());
  }
}

/** Traduz a tecla fisica para os nomes usados no codigo do aluno. */
export function normalizeKey(event: KeyboardEvent): string | null {
  switch (event.code) {
    case 'KeyA':
    case 'ArrowLeft':
      return 'A';
    case 'KeyD':
    case 'ArrowRight':
      return 'D';
    case 'Space':
    case 'ArrowUp':
      return 'SPACE';
    default:
      return null;
  }
}
