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
npm test         # testes unitários (Chrome) — 81 testes
```

## As três fases

Uma fase, uma ferramenta:

| Fase | Linguagem | O que o aluno faz |
| --- | --- | --- |
| 1 | HTML | Cria `<sky>`, `<ball>` e `<ground>` e diz quem fica dentro de quem |
| 2 | CSS | Pinta os três elementos, declara `@animation jump` e aplica na bola |
| 3 | JavaScript | Liga `A`, `D` e `espaço` ao jogo e chega à bandeira |

Na fase 1 os elementos aparecem em cinza — a cor é assunto da fase 2, e ver o cinza virar
azul, vermelho e verde é justamente o que mostra para que serve o CSS.

A linguagem é simplificada de propósito (`@animation` com `inicio/meio/fim`, `position` de `0` a
`1`, `avancar()`, `recuar()`, `element("ball").animation("jump")`), mas a forma é a real:
etiquetas que abrem e fecham, seletores com chaves, condições com `if`.

Cada fase é conferida por **equivalência semântica**, nunca por comparação de texto: espaços,
quebras de linha e a ordem das regras ficam por conta do aluno. Só as cores do enunciado
(`blue`, `red`, `green`) são exigidas exatamente.

Rotas: `/` (deck de abertura), `/sandbox/1..3` (as fases, cada uma abrindo com o slide da sua
ferramenta) e `/fim` (fechamento).

## Roteiro de 15 minutos

| Tempo | O quê |
| --- | --- |
| 0–2 min | **Deck de abertura** (4 slides): o que é front-end e o papel de cada linguagem. Setas, espaço ou swipe avançam; `Esc` pula |
| 2–6 min | **Fase 1 — HTML**. O slide da fase abre sozinho; depois um voluntário escreve as etiquetas. Erre de propósito (`<star>`) e leia o painel de problemas em voz alta |
| 6–10 min | **Fase 2 — CSS**. Pinte primeiro, anime depois. Pergunte "o que muda entre o início e o meio?" antes de escrever |
| 10–14 min | **Fase 3 — JavaScript**. Use os botões na tela (ou o teclado, clicando antes no palco); deixe um aluno chegar à bandeira |
| 14–15 min | Tela final: toda página da internet é feita exatamente assim |

## A assistência dentro da IDE

Quatro recursos ajudam o aluno a não travar na frente da turma:

- **Cards de sintaxe** — abrem com a fase, antes de qualquer digitação: o que a sintaxe faz, um
  exemplo mínimo e o erro comum. Somem na primeira tecla (ou num toque) e voltam pelo botão
  **Sintaxe**.
- **Autocomplete** — sugestões limitadas ao vocabulário da fase, ancoradas no cursor. Setas
  navegam, `Enter`/`Tab` aceita, `Esc` fecha, e um toque também aceita. A lista abre acima do
  cursor quando não há espaço abaixo (teclado virtual do tablet).
- **Fechamento automático** — `<ball>` ganha o seu `</ball>`, `{` ganha a sua chave.
- **Sugestão de bloco depois de 5 segundos parado** — aparece em texto apagado, no estilo de um
  copiloto de IDE: `Tab` aceita, `Esc` descarta, qualquer tecla reinicia a contagem. Ela é
  **determinística e local** — conhece os passos da fase e oferece o primeiro que ainda falta.
  Não há chamada de rede nem modelo de IA por trás. Desliga sozinha com a fase concluída ou com
  a solução na tela.

Botões que salvam a apresentação: **Dica** (revela uma por vez), **Sintaxe**, **Mostrar solução**
e **Reiniciar fase**. A trilha no topo pula direto para qualquer fase, sem exigir a anterior.
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
    services/        progresso, código e slides já vistos, salvos no navegador
  assist/            TypeScript puro: vocabulary, completion, ghost-suggestion,
                     syntax-cards — a assistência da IDE, testável sem DOM
  slides/            deck de apresentação: slide, slide-deck, concept-overlay
                     e slide-definitions.ts (abertura + slide de cada fase)
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
- **A "IA" da IDE é determinística e local** (`assist/ghost-suggestion.ts`): ela conhece os
  passos da fase, não um modelo. Numa escola isso significa zero rede, zero chave de API e
  nenhuma resposta imprevisível na frente da turma.

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
| Mudar o texto dos slides | `src/app/slides/slide-definitions.ts` |
| Mudar os cards de sintaxe | `src/app/assist/syntax-cards.ts` |
| Mudar o que o autocomplete oferece | `src/app/assist/vocabulary.ts` |
| Mudar o que a sugestão de 5 s propõe | `STEPS` em `src/app/assist/ghost-suggestion.ts` |

## Processo

O projeto segue spec-driven development: cada spec vive em [`.specs/`](./.specs/), com o
contexto e a lista de tasks, e vira uma branch com um commit por task. As regras estão em
[`.claude/SDD.md`](./.claude/SDD.md) e [`.claude/github-rules.md`](./.claude/github-rules.md).
