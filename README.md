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
npm test         # testes (Chrome) — 156, dos quais 3 de integração com o Firestore real
```

Os testes de integração usam um usuário de teste do Firebase, lido de `test-credentials.json`
na raiz (ignorado pelo git — copie de `test-credentials.example.json`). Sem o arquivo, eles são
pulados e o resto roda normalmente. A sessão que existia antes dos testes é devolvida no fim.

Para testar apresentador e aluno no mesmo computador, abra `http://localhost:4200` numa aba e
`http://aluno.localhost:4200` em outra: são origens diferentes, cada uma com o seu login e o seu
papel. Para ver o progresso da turma com mais de um aluno, abra também
`http://aluno2.localhost:4200`.

## As três fases

Uma fase, uma ferramenta:

| Fase | Linguagem | O que o aluno faz |
| --- | --- | --- |
| 1 | HTML | Cria `<sky>`, `<ball>` e `<ground>` e diz quem fica dentro de quem |
| 2 | CSS | Pinta os três elementos, declara `@animation jump` e aplica na bola |
| 3 | JavaScript | Liga `A`, `D` e `espaço` ao jogo e chega à bandeira |

Na fase 1 cada elemento aparece branco com borda preta — dá para ver que são três caixas
diferentes antes de qualquer estilo. A cor é assunto da fase 2, e ver o branco virar azul,
vermelho e verde é justamente o que mostra para que serve o CSS.

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
acende com o nome dela ("seletor", "condição"…) e a explicação aparece embaixo.

Todo deck tem **a mesma forma**, para cada etapa da aula durar o mesmo minuto:

| Deck | Slide 1 | Slide 2 | Slide 3 |
| --- | --- | --- | --- |
| Abertura | Você vai escrever um jogo | Três linguagens, três papéis | Uma fase por linguagem |
| 1 — HTML | HTML cria as coisas | Uma tag em três partes | Caixas dentro de caixas |
| 2 — CSS | O seletor encontra a tag | Uma regra em três partes | Criar a animação e aplicar |
| 3 — JS | JavaScript reage (sim ou não) | Um `if` em três partes | Cada tecla, um `if` |

- **3 slides por deck, no máximo 3 etapas por slide**, título de até 6 palavras, texto de apoio
  de até 80 caracteres e até 6 linhas de código. O teste `slide-definitions.spec.ts` reprova
  qualquer deck fora da forma (`slides/slide-shape.ts`) e qualquer código de slide que daria erro
  na IDE.
- **Meta de 20 segundos por slide** (`SLIDE_TARGET_MS` em `slides/slide-pace.ts`). Na máquina do
  apresentador, uma régua fina no rodapé do deck enche até a meta — verde, amarela a partir de
  15s e vermelha depois de 20s — e zera a cada troca de slide. Só ele vê, e nada vai para o
  Firestore.
- Os erros comuns não têm slide: eles ficam no card de sintaxe da IDE e aparecem no painel de
  problemas quando acontecem de verdade.

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
| "Próxima fase" / "Ver o resultado" (no popup de progresso) | Vão para a próxima fase / para o fim |
| "← Voltar" | Voltam um passo da aula, inclusive saindo do código (ver abaixo) |
| "Reiniciar apresentação" (em qualquer tela, com confirmação) | Voltam à abertura, com o código da turma anterior apagado |

Quem entra no meio da aula (ou dá F5) cai direto onde a turma está. O apresentador que dá F5 na
abertura também volta para onde a turma estava.

O **código de cada aluno é local**: não vai para o Firestore. Dicas, cards de sintaxe e
"Reiniciar fase" também são de cada máquina. **Mostrar solução** continua livre para o aluno,
mas avisa o professor: aparece um popup na tela do apresentador ("Uma máquina mostrou a solução
da fase 1" — vários avisos seguidos da mesma fase viram um só, contando as máquinas).

### Progresso da turma

Durante o código de cada fase, a tela do apresentador mostra um popup no canto: **"7 de 12 alunos
terminaram"**, com uma barra que enche a cada aluno que conclui a missão. Quando todos terminam, a
barra fica cheia e **brilha**, e o botão **Próxima fase** (ou **Ver o resultado**, na fase 3) se
destaca. O botão funciona a qualquer momento: o brilho só avisa, quem decide seguir é o professor.
O popup pode ser recolhido numa pílula ("7/12") para não cobrir o palco. Com
`prefers-reduced-motion`, nada pulsa: a barra só muda de cor e ganha um contorno.

- **"Alunos"** são as máquinas que entraram como aluno nesta aula. Uma máquina que fechou a aba
  continua contando, então a barra pode não chegar a 100%: o botão de seguir não depende dela.
- **Concluir conta uma vez por fase.** Quem concluiu e depois quebrou o código continua contado, e
  "Mostrar solução" também conta como concluída (o professor já recebe o aviso de solução).
- **"Reiniciar apresentação" zera a contagem** sem apagar nada: só vale o que veio depois do
  `startedAt` da aula.

### Voltar uma etapa

A aula é uma sequência só: abertura → conceito da fase 1 → código da fase 1 → conceito da fase 2
→ … → código da fase 3 → fim. O **← Voltar** do apresentador sempre leva ao passo anterior dela,
e a turma vai junto:

| Onde o apresentador está | "← Voltar" leva para |
| --- | --- |
| Um slide que não é o primeiro | a etapa ou o slide anterior |
| Primeiro slide do conceito da fase N | o código da fase N−1 (ou o último slide da abertura, na fase 1) |
| Código da fase N (botão na barra de título) | o último slide do conceito da fase N |
| Tela final ("← Voltar ao código") | o código da fase 3 |

O código dos alunos não se perde ao voltar: ele é local e fica salvo por fase. Ao voltar para um
código, o timer daquela fase fica **parado**; ele recomeça com 3 minutos quando o apresentador
fechar o conceito de novo.

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
próprio); só o apresentador grava. Três subcoleções levam o que vai do aluno para o professor:

| Subcoleção | O que guarda |
| --- | --- |
| `alertas` | uma máquina mostrou a solução de uma fase |
| `maquinas/{maquina}` | a máquina entrou como aluno nesta aula (`at`) |
| `conclusoes/{maquina}-{fase}` | a máquina concluiu a missão da fase (`levelId`, `machine`, `at`) |

A máquina é um id aleatório guardado no navegador, não o nome do aluno. Só o apresentador escuta
essas subcoleções; numa aula de 30 alunos elas somam umas 120 gravações.

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

Cada etapa da aula é **3 slides × 20s = 1 minuto**, e cada fase de programação, **3 minutos** de
timer. A conta fecha em 14 minutos, com 1 de folga — sem slide para pular na hora.

| Tempo | O quê |
| --- | --- |
| 0:00–1:00 | Abertura (3 slides) |
| 1:00–2:00 | Conceito da Fase 1 — HTML (3 slides) |
| 2:00–5:00 | Fase 1 programando (timer de 3:00) |
| 5:00–6:00 | Conceito da Fase 2 — CSS (3 slides) |
| 6:00–9:00 | Fase 2 programando |
| 9:00–10:00 | Conceito da Fase 3 — JS (3 slides) |
| 10:00–13:00 | Fase 3 programando |
| 13:00–14:00 | Tela final |
| 14:00–15:00 | Folga |

Uma frase por slide basta — a régua no rodapé diz quando passar:

| Deck | Slide | O que dizer |
| --- | --- | --- |
| Abertura | Você vai escrever um jogo | "Hoje vocês escrevem o código de um jogo." |
| | Três linguagens, três papéis | HTML cria, CSS mostra, JavaScript faz reagir — uma frase por card. |
| | Uma fase por linguagem | "Três slides, três minutos de código, e o jogo funcionando." |
| HTML | HTML cria as coisas | "Tudo na tela é um elemento, que abre e fecha." |
| | Uma tag em três partes | Abertura, conteúdo, fechamento — uma palavra por clique. |
| | Caixas dentro de caixas | "A bola e o chão ficam dentro do céu." |
| CSS | CSS diz como as coisas aparecem | "O `ball` do CSS acha o `<ball>` que vocês criaram." |
| | Uma regra em três partes | Seletor, propriedade, valor. |
| | Criar a animação e aplicar | Cria, define a altura no meio, aplica na bola. |
| JS | JavaScript reage ao jogador | "Ele pergunta o tempo todo: sim ou não?" |
| | Um `if` em três partes | Se, condição, ação. |
| | Cada tecla, um `if` | "D anda, A volta, espaço pula — ao mesmo tempo." |

Na programação: leia o objetivo nos primeiros segundos e avance quando o popup de progresso
**brilhar** (a turma toda terminou) ou quando aparecer **Tempo esgotado** — quem não terminou pode
usar "Mostrar solução" (o aviso aparece na sua tela), e a fase seguinte já começa com o código
pronto. Se a turma precisar rever a sintaxe, o **← Voltar** reabre o conceito da fase.

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
                     LiveSession (Firestore), SessionFollower, alertas de solução,
                     progresso da turma (popup), previous-step e o diálogo de reinício
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
  `phase-timer.ts`, `session-follower.ts`, `previous-step.ts`, `class-progress-state.ts`): ler o documento, calcular o timer e decidir a rota
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
| Mudar a forma dos decks (slides, etapas, tamanho do texto) | `SHAPE` em `src/app/slides/slide-shape.ts` |
| Mudar a meta de tempo por slide | `SLIDE_TARGET_MS` em `src/app/slides/slide-pace.ts` |
| Mudar a duração do timer | `PHASE_DURATION_MS` em `src/app/core/session/phase-timer.ts` |
| Mudar quem pode ler e gravar no Firestore | `firestore.rules` + `npx firebase-tools deploy --only firestore:rules` |

## Processo

O projeto segue spec-driven development: cada spec vive em [`.specs/`](./.specs/), com o
contexto e a lista de tasks, e vira uma branch com um commit por task. As regras estão em
[`.claude/SDD.md`](./.claude/SDD.md) e [`.claude/github-rules.md`](./.claude/github-rules.md).
