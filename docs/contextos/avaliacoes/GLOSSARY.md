# Avaliações

Como as apresentações são avaliadas: os modelos de ficha que a entidade monta, as avaliações que os avaliadores preenchem e as notas que delas saem.

## Language

### Modelos de ficha

**Modelo de ficha**:
O molde de uma avaliação: a sequência de campos que o avaliador vai preencher. Tem nome e versão; cada categoria tem um.
_Avoid_: Ficha avaliativa, ficha (quando se fala do molde), template, formulário

**Campo**:
Uma pergunta da ficha, de um tipo — numérico, alternativa única, alternativa múltipla, descritivo ou observação.
_Avoid_: Quesito, item, pergunta

**Campo global**:
Campo do catálogo compartilhado por todas as entidades. Entra em qualquer modelo, mas ninguém o altera.
_Avoid_: Campo padrão, campo do sistema

**Campo exclusivo**:
Campo que nasce dentro de um modelo de ficha e só existe nele.
_Avoid_: Campo local, campo personalizado, campo custom

**Alternativa**:
Uma das opções de um campo de alternativa. Na alternativa única o avaliador marca uma só; na múltipla, quantas quiser. É o tipo do campo que decide, nunca a quantidade de alternativas.
_Avoid_: Opção, item de escolha

**Posição**:
O lugar que um campo ocupa entre os campos gerais ou entre os campos de um agrupamento. O mesmo campo global pode ocupar várias posições.
_Avoid_: Slot, linha

**Agrupamento**:
Um trecho de posições que o avaliador preenche repetidas vezes — uma por dança, por par, por item —, com nome e quantidade de repetições.
_Avoid_: Grupo, seção, bloco, unidade avaliativa

**Quantidade**:
Quantas vezes os campos de um agrupamento se repetem na avaliação.
_Avoid_: Tamanho, comprimento, length

**Ocorrência**:
Uma das repetições de um agrupamento dentro de uma avaliação, com sua ordem e seu nome — "Danças 2", ou o nome que o avaliador lhe der. O agrupamento é o trecho do modelo; a ocorrência é o trecho preenchido.
_Avoid_: Unidade avaliativa, repetição, instância

### Avaliações

**Avaliador**:
Usuário que avalia as apresentações de uma categoria liberada para avaliação.
_Avoid_: Jurado

**Avaliação**:
O resultado de um avaliador para uma inscrição: as respostas aos campos do modelo de ficha da categoria e a nota que delas sai. Cada avaliador faz uma só por inscrição.
_Avoid_: Ficha preenchida, julgamento

**Rascunho**:
Avaliação começada pelo avaliador e ainda não salva: pode ser deixada e retomada em qualquer etapa. O avaliador tem no máximo um.
_Avoid_: Avaliação em andamento, pendente

**Avaliação na fila**:
Avaliação salva pelo avaliador que aguarda envio. Não é editada na fila: para editá-la, ela sai da fila e volta a ser rascunho.
_Avoid_: Avaliação pendente, não sincronizada

**Avaliação sincronizada**:
Avaliação aceita pelo backend; a partir daí não muda mais.
_Avoid_: Avaliação enviada, concluída

**Avaliação com erro**:
Avaliação que o backend recusou de vez: sai da fila sem travar as outras e espera o avaliador corrigi-la ou descartá-la.
_Avoid_: Avaliação falhada, rejeitada
