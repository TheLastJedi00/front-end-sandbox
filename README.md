# Sandbox Front-end

Um sandbox interativo para apresentar HTML, CSS e JavaScript em **15 minutos**, numa escola.
O aluno escreve o código de um jogo simples — inspirado em Bounce Tales — dentro de uma tela
que imita um editor de verdade, e vê o resultado ao lado, na hora.

Feito em Angular 20 (standalone, signals, zoneless). O professor conduz a aula **ao vivo em todas
as máquinas da sala** pelo Firebase (Auth + Firestore).

## Rodar

```bash
npm install
npm start        # http://localhost:4200 — pede o login do professor
```

Outros comandos:

```bash
npm run build    # build de produção (com SSR/prerender)
npm test         # testes (Chrome) — 146, dos quais 3 de integração com o Firestore real
```

Os testes de integração usam um usuário de teste do Firebase, lido de `test-credentials.json`
na raiz (ignorado pelo git — copie de `test-credentials.example.json`). Sem o arquivo, eles são
pulados e o resto roda normalmente. A sessão que existia antes dos testes é devolvida no fim.

Para testar apresentador e aluno no mesmo computador, abra `http://localhost:4200` numa aba e
`http://aluno.localhost:4200` em outra: são origens diferentes, cada uma com o seu login e o seu
papel.

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

Rotas: `/login`, `/papel` (apresentador ou aluno), `/` (deck de abertura), `/sandbox/1..3` (as
fases, cada uma abrindo com a sequência de slides da sua ferramenta) e `/fim` (fechamento).

## A apresentação

A abertura e cada fase são decks de slides animados, só com CSS:

- **Transição com direção** — avançar empurra o slide para a esquerda, voltar para a direita.
- **Entrada em cascata** — o título entra palavra por palavra e os blocos, um depois do outro.
- **Código que se digita** — os blocos de código aparecem linha a linha, já com o mesmo realce
  da IDE.
- **Etapas** — cards e partes do código esperam o apresentador: `Avançar` revela a próxima
  etapa antes de trocar de slide, e `Voltar` desfaz a última. A barrinha do slide atual enche
  a cada etapa.
- **Fundo vivo** na cor da linguagem (laranja no HTML, azul no CSS, amarelo no JS).

Antes de cada fase, uma **sequência de sintaxe** desmonta o código parte por parte — cada parte
acende com o nome dela ("seletor", "condição"…) e a explicação aparece embaixo:

| Fase | Slides | O que reforça |
| --- | --- | --- |
| 1 — HTML | 5 | anatomia da tag, o que vai entre abertura e fechamento, caixas dentro de caixas, erros comuns |
| 2 — CSS | 7 | anatomia da regra (seletor, propriedade, valor), seletor ↔ tag, `@animation`, aplicar, erros comuns |
| 3 — JS | 6 | anatomia do `if`, verdadeiro ou falso, vários `if`, chamar uma ação, erros comuns |

Com `prefers-reduced-motion` ligado no sistema, cada slide já aparece completo, sem etapas.

## A aula ao vivo

O professor faz login com a conta dele **em cada máquina** da sala. Logo depois, cada máquina
escolhe quem é:

- **Entrar como apresentador** — a máquina do professor (a do projetor). Os botões de navegação
  dela conduzem a turma inteira.
- **Entrar como aluno** — as máquinas da turma. Elas seguem o apresentador: sem botões de
  navegação no deck, sem "Próxima fase", e a trilha de fases não é clicável.

A escolha fica na máquina (um F5 não pergunta de novo); **Sair** desloga e esquece o papel.

O que o apresentador faz, todas as máquinas veem na hora:

| Apresentador | Alunos |
| --- | --- |
| Avança ou volta um slide (ou uma etapa) na abertura | Mesmo slide, mesma etapa |
| Termina a abertura ou pula para o jogo | Vão para a fase 1, com o conceito aberto |
| Avança no conceito da fase e fecha para começar | Mesmo slide; a IDE abre quando ele fecha |
| "Próxima fase" / "Ver o resultado" | Vão para a próxima fase / para o fim |
| "Reiniciar apresentação" no fim | Voltam à abertura, com o código da turma anterior apagado |

Quem entra no meio da aula (ou dá F5) cai direto onde a turma está. O apresentador que dá F5 na
abertura também volta para onde a turma estava.

O **código de cada aluno é local**: não vai para o Firestore. Dicas, cards de sintaxe e
"Reiniciar fase" também são de cada máquina. **Mostrar solução** continua livre para o aluno,
mas avisa o professor: aparece um popup na tela do apresentador ("Uma máquina mostrou a solução
da fase 1" — vários avisos seguidos da mesma fase viram um só, contando as máquinas).

### Timer de 3 minutos

Cada fase de programação tem **3 minutos**, que começam quando o apresentador fecha o conceito.
O relógio fica na barra de título de todas as máquinas, fica amarelo no último minuto e vermelho
no zero. O apresentador pode **pausar/retomar** e **reiniciar**. No zero, todas as máquinas
mostram "Tempo esgotado" — o editor continua funcionando, e avançar é decisão do professor.

O Firestore guarda só quando o timer acaba (`endsAt`), ou quanto falta quando está pausado: cada
máquina conta sozinha, sem gravar nada a cada segundo. Os relógios das máquinas precisam estar
certos (poucos segundos de diferença não atrapalham).

### Como funciona

Tudo vive num documento só, `sessoes/{uid}`. Como todas as máquinas usam a conta do professor,
todas leem o mesmo documento — não há código de sala. Os alunos escutam o documento com
`onSnapshot`, o canal em tempo real do Firestore (conexão aberta, sem polling e sem servidor
próprio); só o apresentador grava. Os avisos de solução vão para `sessoes/{uid}/alertas`.

| Campo | O que guarda |
| --- | --- |
| `stage` | `abertura`, `fase` ou `fim` |
| `levelId` | a fase atual |
| `deck` | slide e etapa do deck na tela |
| `conceptOpen` | se o conceito ainda está por cima da IDE |
| `timer` | `status`, `endsAt` e `remainingMs` |
| `startedAt` | quando a aula começou — muda em "Reiniciar apresentação" |

Se a rede cair, a máquina fica com o último estado recebido e o aluno continua programando;
quando a rede volta, ela se ressincroniza. Uma aula de 30 máquinas gasta alguns milhares de
leituras, bem dentro da cota gratuita.

**Configuração do Firebase** (projeto `front-end-sandbox-91f5f`): provedor E-mail/senha ativado,
a conta do professor criada no console e as regras de `firestore.rules` publicadas com
`npx firebase-tools deploy --only firestore:rules`. As regras deixam cada usuário ler e gravar só
`sessoes/{o próprio uid}`. A configuração web em `core/firebase/firebase.ts` não é segredo.

## Roteiro de 15 minutos

> As sequências de sintaxe cresceram na spec 003 e ainda não têm limite de slides: o encaixe nos
> 15 minutos será revisto. Enquanto isso, `Pular` (ou `Esc`) encerra qualquer sequência.

| Tempo | O quê |
| --- | --- |
| 0–2 min | **Deck de abertura** (4 slides): o que é front-end e o papel de cada linguagem. Setas, espaço, `Enter` ou swipe avançam; `Esc` pula |
| 2–6 min | **Fase 1 — HTML**. A sequência de sintaxe abre sozinha; depois um voluntário escreve as etiquetas. Erre de propósito (`<star>`) e leia o painel de problemas em voz alta |
| 6–10 min | **Fase 2 — CSS**. Pinte primeiro, anime depois. Pergunte "o que muda entre o início e o meio?" antes de escrever |
| 10–14 min | **Fase 3 — JavaScript**. Use os botões na tela (ou o teclado, clicando antes no palco); deixe um aluno chegar à bandeira |
| 14–15 min | Tela final: toda página da internet é feita exatamente assim |

## A assistência dentro da IDE

Quatro recursos ajudam o aluno a não travar na frente da turma:

- **Cards de sintaxe** — abrem com a fase, antes de qualquer digitação: o que a sintaxe faz, um
  exemplo mínimo e o erro comum. Somem na primeira tecla (ou num toque) e voltam pelo botão
  **Sintaxe**.
- **Autocomplete** — sugestões limitadas ao vocabulário da fase, ancoradas no cursor. No HTML a
  sugestão é sempre a tag inteira: `ba` vira `<ball></ball>` com o cursor no meio, e `</ba`
  vira `</ball>`. Setas
  navegam, `Enter`/`Tab` aceita, `Esc` fecha, e um toque também aceita. A lista abre acima do
  cursor quando não há espaço abaixo (teclado virtual do tablet).
- **Fechamento automático** — `<ball>` ganha o seu `</ball>`, `{` ganha a sua chave.
- **Sugestão de bloco depois de 5 segundos parado** — aparece em texto apagado, no estilo de um
  copiloto de IDE: `Tab` aceita, `Esc` descarta, qualquer tecla reinicia a contagem. Ela é
  **determinística e local** — conhece os passos da fase e oferece o primeiro que ainda falta.
  Não há chamada de rede nem modelo de IA por trás. Desliga sozinha com a fase concluída ou com
  a solução na tela.

Botões que salvam a apresentação: **Dica** (revela uma por vez), **Sintaxe**, **Mostrar solução**
e **Reiniciar fase**. Na máquina do apresentador, a trilha no topo pula direto para qualquer
fase (e leva a turma junto), sem exigir a anterior. O código e o progresso ficam salvos no
navegador — um F5 acidental não apaga nada.

Na fase 3 há controles na tela (`A`, `espaço`, `D`) além do teclado, para funcionar em tablets.
Os botões apertam exatamente as mesmas teclas que o código do aluno escuta, então
`if(key("D"))` continua sendo o que decide o que acontece: sem o `if` escrito, o botão não faz
nada.

## Como está organizado

```
src/app/
  core/
    models/          Level, SourceFile, GameState, Diagnostic, ValidationResult
    platform/        acesso ao browser isolado (o app tem SSR) e o relógio (Clock)
    services/        progresso, código e slides já vistos, salvos no navegador
    firebase/        config e init do Firebase, só no navegador
    auth/            AuthStore (login) e guards das rotas
    session/         a aula ao vivo: papel da máquina, estado da sessão, timer,
                     LiveSession (Firestore), SessionFollower e alertas de solução
  assist/            TypeScript puro: vocabulary, completion, ghost-suggestion,
                     syntax-cards — a assistência da IDE, testável sem DOM
  slides/            deck de apresentação: slide, slide-deck, concept-overlay,
                     code-listing, code-anatomy, element-tree, deck-navigation
                     e slide-definitions.ts (abertura + sequência de cada fase)
  engine/            TypeScript puro, sem Angular — é onde estão os testes
    parsers/         html-parser, css-parser, js-parser
    runtime/         scene, renderer, animator, input, game-loop
    validation/      level-validator
  ide/               casca visual: title-bar, activity-bar, file-tabs,
                     code-editor (+ highlight), problems-panel,
                     game-preview (+ preview-input, touch-controls), status-bar,
                     phase-timer
  levels/            level-definitions.ts — as três fases como dados
  pages/             login, role, home, sandbox (goal-panel, level-progress,
                     game-stage), finish
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
  passos da fase, não um modelo. Zero chave de API e nenhuma resposta imprevisível na frente da
  turma — a única rede do app é a sessão ao vivo.
- **A sessão ao vivo é lógica pura por baixo** (`core/session/presentation-state.ts`,
  `phase-timer.ts`, `session-follower.ts`): ler o documento, calcular o timer e decidir a rota
  são funções testáveis sem Firebase; o Firestore só leva e traz o estado.

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
| Mudar o texto dos slides ou as partes desmontadas | `src/app/slides/slide-definitions.ts` — o teste `slide-definitions.spec.ts` quebra se uma parte não existir no código |
| Mudar os cards de sintaxe | `src/app/assist/syntax-cards.ts` |
| Mudar o que o autocomplete oferece | `src/app/assist/vocabulary.ts` |
| Mudar o que a sugestão de 5 s propõe | `STEPS` em `src/app/assist/ghost-suggestion.ts` |
| Mudar a duração do timer | `PHASE_DURATION_MS` em `src/app/core/session/phase-timer.ts` |
| Mudar quem pode ler e gravar no Firestore | `firestore.rules` + `npx firebase-tools deploy --only firestore:rules` |

## Processo

O projeto segue spec-driven development: cada spec vive em [`.specs/`](./.specs/), com o
contexto e a lista de tasks, e vira uma branch com um commit por task. As regras estão em
[`.claude/SDD.md`](./.claude/SDD.md) e [`.claude/github-rules.md`](./.claude/github-rules.md).
