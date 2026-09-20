# Sandbox Front-end

Um sandbox interativo para apresentar HTML, CSS e JavaScript em **15 minutos**, numa escola.
O aluno escreve o código de um jogo simples — inspirado em Bounce Tales — dentro de uma tela
que imita um editor de verdade, e vê o resultado ao lado, na hora.

Feito em Angular 20 (standalone, signals, zoneless).

## Rodar

```bash
npm install
npm start        # http://localhost:4200
```

Outros comandos:

```bash
npm run build    # build de produção (com SSR/prerender)
npm test         # testes unitários (Chrome) — 50 testes
```

## As três fases

| Fase | Linguagem | O que o aluno faz |
| --- | --- | --- |
| 1 | HTML + CSS | Cria `<sky>`, `<ball>` e `<ground>` e pinta cada um |
| 2 | CSS | Declara `@animation jump` e aplica na bola |
| 3 | JavaScript | Liga `A`, `D` e `espaço` ao jogo e chega à bandeira |

A linguagem é simplificada de propósito (`@animation` com `inicio/meio/fim`, `position` de `0` a
`1`, `avancar()`, `recuar()`, `element("ball").animation("jump")`), mas a forma é a real:
etiquetas que abrem e fecham, seletores com chaves, condições com `if`.

Cada fase é conferida por **equivalência semântica**, nunca por comparação de texto: espaços,
quebras de linha e a ordem das regras ficam por conta do aluno. Só as cores do enunciado
(`blue`, `red`, `green`) são exigidas exatamente.

Rotas: `/` (abertura), `/sandbox/1..3` (as fases) e `/fim` (fechamento).

## Roteiro de 15 minutos

| Tempo | O quê |
| --- | --- |
| 0–2 min | Tela de abertura: HTML é o que existe, CSS é como aparece, JS é o que acontece |
| 2–6 min | **Fase 1** — um voluntário escreve as etiquetas; erre de propósito (`<star>`) e leia o painel de problemas em voz alta |
| 6–10 min | **Fase 2** — a animação. Pergunte "o que muda entre o início e o meio?" antes de escrever |
| 10–14 min | **Fase 3** — o controle. Use os botões na tela (ou o teclado, clicando antes no palco); deixe um aluno chegar à bandeira |
| 14–15 min | Tela final: toda página da internet é feita exatamente assim |

Botões que salvam a apresentação: **Dica** (revela uma por vez), **Mostrar solução** e
**Reiniciar fase**. A trilha no topo pula direto para qualquer fase, sem exigir a anterior.
O código e o progresso ficam salvos no navegador — um F5 acidental não apaga nada.

Na fase 3 há controles na tela (`A`, `espaço`, `D`) além do teclado, para funcionar em tablets.
Os botões apertam exatamente as mesmas teclas que o código do aluno escuta, então
`if(key("D"))` continua sendo o que decide o que acontece: sem o `if` escrito, o botão não faz
nada.

## Como está organizado

```
src/app/
  core/
    models/          Level, SourceFile, GameState, Diagnostic, ValidationResult
    platform/        acesso ao browser isolado (o app tem SSR)
    services/        progresso e código salvos no navegador
  engine/            TypeScript puro, sem Angular — é onde estão os testes
    parsers/         html-parser, css-parser, js-parser
    runtime/         scene, renderer, animator, input, game-loop
    validation/      level-validator
  ide/               casca visual: title-bar, activity-bar, file-tabs,
                     code-editor (+ highlight), problems-panel,
                     game-preview (+ preview-input, touch-controls), status-bar
  levels/            level-definitions.ts — as três fases como dados
  pages/             home, sandbox (goal-panel, level-progress, game-stage), finish
```

`engine/` não conhece Angular: recebe texto e devolve árvore, cena e resultado. `ide/` só
desenha. A página do sandbox liga os dois com signals, e todos os componentes são `OnPush`.

Três decisões que explicam o resto do código:

- **O preview é DOM real** (literalmente `<sky>`, `<ground>` e `<ball>`), não canvas: ver o
  próprio código virar imagem é o ponto pedagógico da fase 1.
- **O editor é próprio** (`<textarea>` + realce por regex): a sintaxe aceita é pequena, e um
  Monaco prometeria ao aluno uma IDE completa que este sandbox não é.
- **O estado por quadro fica isolado** em `pages/sandbox/game-stage.ts`, para que a página não
  seja reavaliada 60 vezes por segundo.

## Mexer nas fases

Quase todo ajuste pedagógico é em `src/app/levels/level-definitions.ts`: enunciado, texto de
apoio, código inicial, solução, dicas, arquivos habilitados e critérios de conclusão.

Para ir além:

| Quero… | Onde |
| --- | --- |
| Aceitar uma etiqueta nova | `ALLOWED_TAGS` em `engine/parsers/html-parser.ts` |
| Aceitar uma propriedade CSS nova | `ALLOWED_PROPERTIES` em `engine/parsers/css-parser.ts` |
| Aceitar um comando novo no JS | `engine/parsers/js-parser.ts` e `Action` no game loop |
| Mudar as cores com nome | `NAMED_COLORS` em `engine/runtime/scene.ts` |
| Ajustar velocidade, altura do pulo ou o alvo | `game-loop.ts`, `renderer.ts`, `core/models/game-state.ts` |
| Criar um critério de conclusão | `LevelCheckId` em `core/models/validation.ts` + `CHECKS` no validador |

## Processo

O projeto segue spec-driven development: cada spec vive em [`.specs/`](./.specs/), com o
contexto e a lista de tasks, e vira uma branch com um commit por task. As regras estão em
[`.claude/SDD.md`](./.claude/SDD.md) e [`.claude/github-rules.md`](./.claude/github-rules.md).
