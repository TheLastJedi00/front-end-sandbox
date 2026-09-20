# Objetivo
- Transformar o sandbox da spec 001 numa **apresentação guiada**: o aluno não cai direto no código, ele é conduzido por slides antes de cada etapa
- Reorganizar as fases para que **cada fase ensine uma única ferramenta** (HTML, depois CSS, depois JS)
- Dar **assistência dentro da IDE** para que ninguém trave na frente da turma nos 15 minutos de apresentação

# Contexto atual (o que já existe)
- 3 fases jogáveis: Fase 1 = HTML + CSS (estrutura e cores), Fase 2 = animação, Fase 3 = JS
- Tela de abertura curta, painel de objetivo, dicas, "mostrar solução" e tela final
- IDE própria (`<textarea>` + realce por regex), preview em DOM real, engine com parsers próprios

# Proposta
## 1. Apresentação visual de abertura
- Antes de começar o jogo, uma abertura **em formato de slides**, com visual moderno e animado — não a tela de texto atual
- Conteúdo: o que é front-end e como HTML, CSS e JS se relacionam (estrutura, aparência, comportamento)
- Precisa funcionar projetada em 16:9 e ser navegável pelo apresentador (avançar/voltar, pular para o jogo)

## 2. Slide de conceito antes de cada fase
- Cada fase passa a ser aberta por **um slide da ferramenta daquela fase**, apresentando o conceito e a sintaxe que o aluno vai usar em seguida
- O slide é curto: o objetivo é dar vocabulário antes da mão no código, não dar aula
- O apresentador pode pular o slide e ir direto para a IDE

## 3. Fases redivididas por ferramenta
A fase 1 atual mistura HTML e CSS. Ela é dividida, e o conteúdo é redistribuído para que cada fase tenha uma ferramenta só:

- **Fase 1 — HTML:** apenas a estrutura. Colocar `<ball>` e `<ground>` dentro de `<sky>`. Sem cores.
- **Fase 2 — CSS:** aparência e movimento. Colorir os três elementos **e** declarar/aplicar a `@animation jump`.
- **Fase 3 — JS:** comportamento. Continua como está (`key`, `avancar`, `recuar`, `element("ball").animation("jump")`).

Consequências: a Fase 1 abre só a aba `index.html`; a Fase 2 abre o CSS já com o HTML pronto; a validação e o texto de cada fase acompanham a nova divisão.

## 4. Assistência dentro da IDE
Quatro recursos, do mais passivo ao mais ativo:

- **Cards de sintaxe:** ao entrar na fase, antes do aluno digitar, aparecem cards explicando a sintaxe daquela fase (ex.: como se abre e fecha uma tag, como se escreve um bloco CSS). Devem sair do caminho assim que ele começar a escrever.
- **Autocomplete:** sugestões enquanto digita, limitadas ao vocabulário da fase (`sky`, `ball`, `ground`, `color`, `animation`, `inicio/meio/fim`, `key`, `avancar`, `recuar`).
- **Sugestão de palavra dedicada:** completar a palavra/token que está sendo digitado, incluindo o fechamento automático de tag e de bloco.
- **Sugestão de código "com cara de IA":** se o aluno ficar **5 segundos sem digitar**, a IDE sugere o próximo trecho de código em texto fantasma (estilo Copilot), aceitável com Tab e descartável com Esc. É uma simulação determinística baseada na fase e no que já foi escrito — não há chamada a nenhum serviço de IA.

# Restrições
- Sem dependência nova de editor (Monaco/CodeMirror) — mantém o editor próprio da spec 001
- Sem chamada de rede, sem backend, sem chave de API: a "IA" é simulada localmente
- UI em português; palavras-chave de código em inglês
- Alunos usam tablets: slides e assistência precisam funcionar no toque
- Tudo continua cabendo em 15 minutos, e o apresentador precisa poder pular qualquer etapa

# Fora de escopo
- IA real / integração com LLM
- Novas fases além da redivisão descrita
- Editor de slides ou conteúdo configurável pelo usuário final

# Decisões assumidas
- O total continua **3 fases**: a parte de CSS da fase 1 antiga é absorvida pela nova Fase 2, junto com a animação
- A abertura em slides **substitui** a tela de abertura atual em vez de se somar a ela
- Os cards de sintaxe são conteúdo declarado junto da definição da fase, como já acontece com dicas e briefing
