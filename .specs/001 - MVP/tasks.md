# Tasks — 001 MVP

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/MVP` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

```
src/app/
  core/                     # modelos e serviços transversais
    models/                 # Level, GameState, SourceFile, ValidationResult
  engine/                   # runtime do jogo (TypeScript puro, sem DOM do Angular)
    parsers/                # mini-HTML, mini-CSS, mini-JS
    runtime/                # cena, animação, input, game loop
    validation/             # comparação com o resultado esperado
  ide/                      # casca visual estilo VS Code
    editor/                 # editor de código com abas html/css/js
    preview/                # área de preview do jogo
  levels/                   # definição declarativa das 3 fases
  pages/sandbox/            # página que orquestra tudo (lazy loaded)
```

Princípios: `engine/` é puro e testável; `ide/` só apresenta; estado em signals; todos os componentes `OnPush`.

---

## Fase 0 — Fundação

- [ ] **T0.1** — Limpar o boilerplate de `app.html`/`app.scss` e definir o shell da aplicação.
- [ ] **T0.2** — Criar rotas `/` (abertura) e `/sandbox/:levelId` com lazy loading em `app.routes.ts`.
- [ ] **T0.3** — Definir os design tokens SCSS do tema escuro estilo VS Code (cores, tipografia monoespaçada, espaçamentos) em `src/styles.scss`.
- [ ] **T0.4** — Criar os modelos de domínio em `core/models`: `Level`, `SourceFile` (`html|css|js`), `GameState`, `ValidationResult`.
- [ ] **T0.5** — Garantir que o sandbox só execute no browser (`isPlatformBrowser` / `afterNextRender`), já que o projeto está com SSR ligado.

## Fase 1 — Casca da IDE

- [ ] **T1.1** — `ide/ide-shell`: layout de duas colunas (código à esquerda, preview à direita), legível em projetor 16:9.
- [ ] **T1.2** — `ide/title-bar` e `ide/activity-bar`: barras decorativas que completam a estética de IDE.
- [ ] **T1.3** — `ide/file-tabs`: abas `index.html`, `style.css`, `script.js` controladas por signal e habilitadas conforme a fase.
- [ ] **T1.4** — `ide/editor`: área de edição com numeração de linhas, fonte monoespaçada e `output()` de mudança com debounce.
- [ ] **T1.5** — `ide/editor`: realce de sintaxe por regex sobre um `<pre>` espelhado, sem dependência externa.
- [ ] **T1.6** — `ide/problems-panel`: painel inferior com os erros do parser e as dicas da fase.

## Fase 2 — Engine: parsers

- [ ] **T2.1** — `engine/parsers/html-parser`: transforma `<sky>`, `<ground>`, `<ball>` numa árvore de nós, com erros amigáveis (tag não fechada, tag desconhecida, aninhamento inválido).
- [ ] **T2.2** — `engine/parsers/css-parser`: blocos `seletor { propriedade: valor }` com as propriedades permitidas (`color`, `animation`) e aviso para o restante.
- [ ] **T2.3** — `engine/parsers/css-parser`: suporte ao bloco `@animation nome { inicio | meio | fim { position: n } }` (sintaxe simplificada da spec).
- [ ] **T2.4** — `engine/parsers/js-parser`: interpretador mínimo para `if (key("X")) { ... }` e para as chamadas `avancar()`, `recuar()` e `element("ball").animation("jump")`.
- [ ] **T2.5** — Testes unitários dos três parsers (casos válidos + os erros de sintaxe típicos de um aluno).

## Fase 3 — Engine: runtime

- [ ] **T3.1** — `engine/runtime/scene`: converte a árvore HTML + os estilos numa cena (céu, terreno, bola) com posições e cores.
- [ ] **T3.2** — `engine/runtime/renderer`: desenha a cena no preview (ver **Q.2**).
- [ ] **T3.3** — `engine/runtime/animator`: executa a animação declarada interpolando a posição vertical da bola entre `inicio`, `meio` e `fim`.
- [ ] **T3.4** — `engine/runtime/input`: captura `A`, `D` e `space` somente quando o preview está focado, sem sequestrar o teclado do editor.
- [ ] **T3.5** — `engine/runtime/game-loop`: `requestAnimationFrame` com play/pause/reset amarrado ao ciclo de vida do componente.
- [ ] **T3.6** — Testes unitários de cena e animação.

## Fase 4 — Fases do jogo

- [ ] **T4.1** — `levels/level-definitions`: as 3 fases declarativas (enunciado, código inicial, arquivos habilitados, critério de sucesso, dicas).
- [ ] **T4.2** — `engine/validation/level-validator`: valida o resultado por estrutura e semântica, não por texto literal (aceita variações de formatação).
- [ ] **T4.3** — **Fase 1 do jogo**: posicionar `<ball>` e `<ground>` dentro de `<sky>` e colorir os três elementos; conclui ao atingir a cena esperada.
- [ ] **T4.4** — **Fase 2 do jogo**: declarar `@animation jump` e aplicá-la em `ball`; conclui quando a bola pula no preview.
- [ ] **T4.5** — **Fase 3 do jogo**: mover a bola com `A`/`D` e pular com `space`; conclui ao alcançar o objetivo no terreno (ver **Q.6**).
- [ ] **T4.6** — Feedback de conclusão: destaque no preview, botão "Próxima fase" e avanço de rota.

## Fase 5 — Experiência de apresentação (15 min)

- [ ] **T5.1** — Tela de abertura curta: HTML = estrutura, CSS = aparência, JS = comportamento, com botão "Começar".
- [ ] **T5.2** — Barra de progresso das 3 fases e navegação livre entre elas, para o apresentador pular etapas.
- [ ] **T5.3** — Botões "Dica" e "Mostrar solução" por fase — essenciais para a apresentação não travar.
- [ ] **T5.4** — Botão "Reiniciar fase" restaurando o código inicial.
- [ ] **T5.5** — Tela final amarrando os três conceitos ao que o aluno acabou de construir.

## Fase 6 — Qualidade e entrega

- [ ] **T6.1** — Acessibilidade: foco visível, `aria-label` nos controles, contraste do tema validado e descrição textual do preview.
- [ ] **T6.2** — Persistência do código por fase em `localStorage`, protegendo contra refresh acidental durante a apresentação.
- [ ] **T6.3** — Revisão de performance: `OnPush` em todos os componentes e nenhum re-render de Angular por frame.
- [ ] **T6.4** — `README.md` com instruções de execução e o roteiro de 15 minutos da apresentação.
- [ ] **T6.5** — Testar no navegador, com o app rodando localmente, as três fases de ponta a ponta (exigência do SDD).
- [ ] **T6.6** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Decididas pelo usuário em 2026-09-19:**

- **Q.2 — Preview: DOM real.** ✅ Decidido.
- **Q.3 — Editor próprio** (`<textarea>` + realce por regex), sem Monaco/CodeMirror. ✅ Decidido.

As demais seguem pela recomendação, salvo orientação contrária.

- **Q.1 — Idioma da interface.** O `context.md` está em pt-BR e o público é escolar. Assumo **toda a UI em português**, mantendo as palavras-chave de código em inglês (`color`, `animation`, `position`) para manter fidelidade ao HTML/CSS/JS reais. Confirma?
- **Q.2 — Tecnologia do preview.** (a) DOM real, com os elementos posicionados via CSS; (b) `<canvas>`, com mais controle sobre a física do pulo. Recomendação: **(a) DOM**, porque o ponto pedagógico é justamente ver o DOM virar imagem.
- **Q.3 — Editor de código.** Adicionar Monaco/CodeMirror (realce e autocomplete profissionais, mas +dependência e +bundle) ou editor próprio com `<textarea>` e realce por regex? Recomendação: **editor próprio** — o subconjunto de sintaxe é minúsculo. Como a decisão adiciona dependência, aguardo resposta antes da T1.5.
- **Q.4 — Rigor da validação.** A fase conclui quando o resultado é *equivalente* ao esperado ou exige exatamente o código do exemplo? Recomendação: **equivalência semântica**, com as cores do enunciado (`blue`, `red`, `green`) como critério exato.
- **Q.5 — SSR.** O projeto está com `outputMode: server`, mas o sandbox é 100% client-side. Manter o SSR e apenas proteger o acesso ao `window`, ou simplificar para build estático? Recomendação: **manter e proteger**, para não mexer em infraestrutura fora do escopo do MVP.
- **Q.6 — Condição de vitória da fase 3.** O `context.md` descreve os comandos, mas não o objetivo. Recomendação: **alcançar um alvo no fim do terreno**, exigindo pelo menos um pulo.
- **Q.7 — Suporte a toque.** A apresentação roda projetada com teclado disponível, ou os alunos usam tablets? Isso decide se a T3.4 precisa de controles na tela.
