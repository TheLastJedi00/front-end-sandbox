# Objetivo
- O apresentador **vê quantos alunos já terminaram a missão prática** da fase, num popup com uma barra de progresso. Quando a turma inteira termina, a barra **brilha** e chama a atenção para o botão de seguir para a próxima fase
- O apresentador pode **reiniciar a apresentação inteira** a qualquer momento, e não só na tela final
- O apresentador pode **voltar uma etapa** a qualquer momento, inclusive saindo do código de uma fase para o conceito dela, ou do conceito para o código da fase anterior

# Contexto atual (o que já existe)
- Sessão ao vivo da spec 004: documento `sessoes/{uid}` com `stage`, `levelId`, `deck`, `conceptOpen`, `timer` e `startedAt`. O apresentador grava e os alunos seguem com `onSnapshot`
- Todas as máquinas usam a conta do professor. Cada máquina já tem um **id aleatório** guardado no `localStorage` (`SolutionAlerts.machineId`), usado hoje só para contar alertas de solução
- Os alertas de solução (`sessoes/{uid}/alertas`) já mostram um popup na tela do apresentador (`solution-toasts`). É o único dado que vai do aluno para o professor
- **Fim da fase:** o botão "Próxima fase" só aparece quando a fase está concluída **na máquina do próprio apresentador**. Na máquina do projetor normalmente ninguém programa, então o professor depende da trilha de fases (`level-progress`) para seguir
- **Reiniciar apresentação** (`LiveSession.restart`) só existe em `/fim`. Ele grava um `startedAt` novo, e as máquinas dos alunos apagam o código e o progresso da turma anterior
- **Voltar:** o deck tem "← Voltar" entre slides e etapas, mas fica desabilitado no primeiro slide. Depois que o conceito fecha e a IDE abre, não há como voltar para o conceito da fase, nem do conceito para a fase anterior

# Proposta
## 1. Popup de progresso da turma
**Na máquina do aluno**
- Quando a missão da fase fica concluída (`validation().completed`), a máquina grava uma vez que concluiu aquela fase: `sessoes/{uid}/conclusoes/{maquina}-{fase}` com `{ levelId, machine, at }`. O id fixo do documento garante que a mesma máquina conta uma vez só por fase, mesmo com F5 ou se o código quebrar e voltar a funcionar
- A máquina também se registra como presente na aula ao entrar como aluno: `sessoes/{uid}/maquinas/{maquina}` com `{ at }`. Essa é a base da conta ("de quantos")

**Na máquina do apresentador**
- Durante o código de uma fase (conceito fechado), um popup fixo no canto mostra:
  - "**7 de 12** alunos terminaram"
  - uma barra estilo *loading* que enche conforme os alunos concluem
  - o botão **Próxima fase** (ou **Ver o resultado** na fase 3), sempre disponível
- Quando todos concluem (`concluídos = presentes`, com pelo menos 1 aluno), a barra fica cheia e **começa a brilhar** em pulso, e o botão ganha destaque. A ideia é que o professor perceba de longe que pode seguir
- Com `prefers-reduced-motion` não há pulso: a barra só muda para a cor de sucesso e ganha um contorno
- O popup pode ser **recolhido** para uma pílula pequena ("7/12"), sem sumir, para não cobrir o palco do jogo
- Contam só as máquinas e conclusões **desta aula**: tudo com `at` anterior ao `startedAt` da sessão é ignorado. Reiniciar a apresentação zera a contagem sem apagar nada no Firestore

## 2. Reiniciar a apresentação de qualquer ponto
- Um botão **Reiniciar apresentação** fica disponível para o apresentador em todas as telas da aula (abertura, conceito, código e fim), junto do selo de sessão
- Por ser destrutivo (apaga o código da turma), pede **confirmação dentro da tela**, num diálogo próprio, sem `confirm()` do navegador: "Reiniciar volta todas as máquinas à abertura e apaga o código da turma"
- Usa o `LiveSession.restart` que já existe: nada muda na sincronização

## 3. Voltar uma etapa, inclusive saindo do código
A aula vira uma sequência linear, e "Voltar" sempre leva ao passo anterior dela:

```
abertura (slides) → fase 1: conceito (slides) → fase 1: código → fase 2: conceito → fase 2: código → fase 3: conceito → fase 3: código → fim
```

| Onde o apresentador está | "Voltar" leva para |
| --- | --- |
| Qualquer slide que não é o primeiro | etapa ou slide anterior (como hoje) |
| Primeiro slide do conceito da fase N | código da fase N−1, ou último slide da abertura se N = 1 |
| Código da fase N | último slide do conceito da fase N (o conceito reabre por cima da IDE) |
| Tela final | código da fase 3 |
| Primeiro slide da abertura | nada (o botão fica desabilitado) |

- No deck, o "← Voltar" do primeiro slide **deixa de ficar desabilitado** quando existe passo anterior
- Na IDE, o apresentador ganha um botão **← Voltar** na barra de título, ao lado do timer
- O código dos alunos **não se perde** ao voltar: ele é local e continua salvo por fase
- **Timer ao voltar para o código:** volta **parado** (`IDLE_TIMER`), e o apresentador decide se inicia de novo. Ver decisões assumidas
- A regra "qual é o passo anterior" é uma função pura sobre `PresentationState`, testada

# Restrições
- Consumo do Firestore continua pequeno. Por aula com 30 alunos e 3 fases: ~30 gravações de presença + até ~90 de conclusão. O apresentador escuta duas subcoleções filtradas por `at >= startedAt` e recebe só as mudanças (~120 leituras por aula). Os alunos não escutam nada novo
- Regras do Firestore: as subcoleções novas já caem em `sessoes/{uid}/{document=**}`, então **não muda a regra**
- Nenhum dado de aluno além do id aleatório da máquina e da fase concluída (mesma linha da spec 004)
- Mantém o que veio das specs anteriores: OnPush, signals, animação só em CSS, `prefers-reduced-motion`, toque e 16:9, UI em português, Firebase só no navegador (prerender intacto)

# Fora de escopo
- Ver quem é cada aluno, o código dele ou o tempo que cada um levou
- Avançar sozinho quando todos terminarem: o brilho só avisa, quem decide é o professor
- Detectar máquina que fechou a aba no meio da aula (presença em tempo real ou *heartbeat*)
- Desfazer o "Reiniciar apresentação"

# Decisões assumidas
- **"Alunos" = máquinas que entraram como aluno nesta aula.** Uma máquina que fechou a aba continua contando no total. Se isso deixar a barra presa abaixo de 100%, o botão de seguir continua disponível de qualquer jeito
- **Conclusão é permanente na fase:** quem concluiu e depois quebrou o código continua contado, igual à trilha (`ProgressStore`)
- **Mostrar a solução conta como concluída.** O professor já recebe o alerta de solução da spec 004, então não há contagem separada
- **O botão de seguir no popup não depende da fase concluída na máquina do apresentador**, e substitui o "Próxima fase" que hoje só aparece nesse caso
- **Ao voltar para o código, o timer fica parado** em vez de retomar o que sobrou: o documento não guarda o tempo restante de fases anteriores, e retomar exigiria guardar um timer por fase
- **Reiniciar pede confirmação** porque apaga o código de toda a turma; voltar não pede, porque não apaga nada
