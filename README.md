# Sandbox Front-end

Um sandbox interativo para apresentar HTML, CSS e JavaScript em **15 minutos**, numa escola.
O aluno escreve o código de um jogo simples — inspirado em Bounce Tales — dentro de uma tela
que imita um editor de verdade, e vê o resultado ao lado, na hora.

## Rodar

```bash
npm install
npm start        # http://localhost:4200
```

Outros comandos:

```bash
npm run build    # build de produção (com SSR/prerender)
npm test         # testes unitários (Chrome)
```

## As três fases

| Fase | Linguagem | O que o aluno faz |
| --- | --- | --- |
| 1 | HTML + CSS | Cria `<sky>`, `<ball>` e `<ground>` e pinta cada um |
| 2 | CSS | Declara `@animation jump` e aplica na bola |
| 3 | JavaScript | Liga as teclas `A`, `D` e `espaço` ao jogo e chega à bandeira |

A linguagem é simplificada de propósito (`@animation` com `inicio/meio/fim`, `position: 0` a `1`,
`avancar()`, `recuar()`, `element("ball").animation("jump")`), mas a forma é a real: etiquetas que
abrem e fecham, seletores com chaves, condições com `if`.

## Roteiro de 15 minutos

| Tempo | O quê |
| --- | --- |
| 0–2 min | Tela de abertura: HTML é o que existe, CSS é como aparece, JS é o que acontece |
| 2–6 min | **Fase 1** — um voluntário escreve as etiquetas; mostre o erro de propósito (`<star>`) e leia o painel de problemas em voz alta |
| 6–10 min | **Fase 2** — a animação. Pergunte "o que muda entre o início e o meio?" antes de escrever |
| 10–14 min | **Fase 3** — o controle. Use os botões na tela (ou o teclado, clicando antes no palco); deixe um aluno chegar à bandeira |
| 14–15 min | Tela final: toda página da internet é feita exatamente assim |

Na fase 3 há controles na tela (`A`, `espaço`, `D`) além do teclado, para funcionar em tablets:
os botões apertam exatamente as mesmas teclas que o código do aluno escuta, então
`if(key("D"))` continua sendo o que decide o que acontece.

Botões que salvam a apresentação: **Dica** (revela uma dica por vez), **Mostrar solução** e
**Reiniciar fase**. A trilha no topo permite pular direto para qualquer fase.
O código e o progresso ficam salvos no navegador — um F5 acidental não apaga nada.

## Como está organizado

```
src/app/
  core/       modelos de domínio, serviços de progresso e persistência
  engine/     parsers (HTML/CSS/JS simplificados), runtime do jogo e validação
  ide/        componentes visuais do editor (abas, editor, problemas, preview)
  levels/     as três fases declaradas como dados
  pages/      abertura, sandbox e tela final
```

`engine/` é TypeScript puro, sem Angular, e concentra os testes. O preview usa **DOM real**
(literalmente `<sky>`, `<ground>` e `<ball>`), não canvas: ver o próprio código virar imagem é o
ponto pedagógico da fase 1. O editor também é próprio, porque a sintaxe aceita é pequena e não
vale prometer ao aluno uma IDE completa.
