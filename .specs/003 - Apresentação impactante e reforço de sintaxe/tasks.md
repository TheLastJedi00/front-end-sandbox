# Tasks — 003 Apresentação impactante e reforço de sintaxe

> Padrão de execução: ver [github-rules](../../.claude/github-rules.md).
> Branch: `feat/apresentacao-impactante` · 1 task = 1 commit · PR contra `main` ao fim da spec.

## Visão da arquitetura

Nada do `engine/` nem das fases muda. O que muda:

```
src/app/
  assist/completion.ts        # corrige o autocomplete de tags do HTML
  ide/code-editor/highlight.ts  # ganha highlightLines(), reaproveitado pelos slides
  slides/
    deck-navigation.ts        # NOVO — posição (slide + etapa) como função pura
    code-listing/             # NOVO — código com realce, revelado linha a linha
    code-anatomy/             # NOVO — código com as partes rotuladas, uma por etapa
    element-tree/             # NOVO — caixas aninhadas: quem está dentro de quem
    slide/                    # entrada escalonada, pontos por etapa, novos blocos
    slide-deck/               # transição com direção, etapas, fundo animado
    concept-overlay/          # vira um mini-deck (conceito + sintaxe)
    slide-definitions.ts      # CONCEPT_SLIDES passa a ser uma sequência por fase
styles.scss                   # cores de token globais, @property do acento
```

Princípios mantidos: animação só em CSS (Angular `animate.enter`/`animate.leave` só troca
classes), lógica de navegação pura e testável, `OnPush`, signals, nenhuma dependência nova.

---

## Fase 0 — Correção do autocomplete de tags

- [ ] **T0.1** — `assist/completion`: no HTML, `ba` vira `<ball></ball>` e `</ba` vira `</ball>`, sem duplicar um `>` que já esteja depois do cursor.
- [ ] **T0.2** — `assist/completion`: a lista mostra a tag como ela vai ficar (`<ball>`, `</ball>`).
- [ ] **T0.3** — Testes de `completion` para os três casos da tabela do contexto e para o `>` já existente.

## Fase 1 — Base visual do deck

- [ ] **T1.1** — Cores de token globais em `styles.scss` e `highlightLines()` em `highlight.ts`, para slides e editor usarem o mesmo realce.
- [ ] **T1.2** — `slides/code-listing`: bloco de código com realce, linhas reveladas uma a uma (efeito de digitação).
- [ ] **T1.3** — `slides/slide-deck`: cada slide é recriado ao trocar (a entrada volta a rodar) e a transição tem direção — avançar sai pela esquerda, voltar pela direita.
- [ ] **T1.4** — `slides/slide`: entrada escalonada de título, texto, cards e código.
- [ ] **T1.5** — Fundo animado na cor da linguagem, com troca suave de cor entre slides (`@property`).

## Fase 2 — Etapas dentro do slide (builds)

- [ ] **T2.1** — `slides/deck-navigation`: posição = slide + etapa; avançar revela a próxima etapa antes de trocar de slide; voltar vai ao slide anterior já completo. Com testes.
- [ ] **T2.2** — `slides/slide-deck` + `slides/slide`: pontos (cards) revelados um por etapa; indicador de etapa no progresso.
- [ ] **T2.3** — Com `prefers-reduced-motion`, todas as etapas já aparecem reveladas.

## Fase 3 — Componentes de sintaxe

- [ ] **T3.1** — `slides/code-anatomy`: código dividido em partes rotuladas (ex.: "abertura", "seletor", "condição"); cada etapa destaca uma parte e mostra a explicação dela. Função de segmentação pura, com testes.
- [ ] **T3.2** — `slides/element-tree`: caixas aninhadas que mostram quem está dentro de quem, montadas em sequência.

## Fase 4 — Conteúdo

- [ ] **T4.1** — `slides/concept-overlay`: vira um mini-deck; `CONCEPT_SLIDES` passa a ser uma sequência por fase.
- [ ] **T4.2** — Sequência do **HTML**: conceito, anatomia da tag, elemento vazio vs. com conteúdo, aninhamento em árvore.
- [ ] **T4.3** — Sequência do **CSS**: conceito, anatomia da regra, seletor ↔ tag do HTML, `@animation` e como aplicá-la.
- [ ] **T4.4** — Sequência do **JavaScript**: conceito, anatomia do `if`, verdadeiro/falso, vários `if`, chamar uma ação.
- [ ] **T4.5** — Abertura revisada com os novos componentes (realce, etapas).

## Fase 5 — Qualidade e entrega

- [ ] **T5.1** — Acessibilidade: etapa atual anunciada (`aria-live`), rótulos da anatomia legíveis por leitor de tela, foco preservado no botão de avançar.
- [ ] **T5.2** — Testar no navegador, rodando localmente: abertura, sequência de cada fase, etapas, transições e o autocomplete corrigido.
- [ ] **T5.3** — Atualizar o `README.md`.
- [ ] **T5.4** — `npm run build` e `npm test` verdes; push da branch e PR contra `main`.

---

## Questões

**Decididas pelo usuário em 2026-09-30:**

- **Q.1 — Sem limite de slides por fase** por enquanto; o encaixe nos 15 minutos será revisto depois. ✅
- **Q.2 — Etapas (builds):** "Avançar" revela a próxima parte do slide antes de trocar de slide. ✅
