# App mobile do avaliador — handoff do /wayfinder

Estado de uma sessão de `/wayfinder` interrompida no **passo 1–2 do "Chart the map"** (grilling do destino e da fronteira), antes de criar o mapa no Linear. Para retomar: rode `/wayfinder` e peça para continuar a partir deste arquivo — responder à Rodada 3, depois criar o mapa (`wayfinder:map`) e os tickets no time `TE`.

Fonte da verdade da API para ficha e envio: `exemplo-frontend-envio-avaliacao.md` (copiado para `docs/planos/exemplo-frontend-envio-avaliacao.md`). Exemplo real de GET de modelo: `GET /api/v1/fichas-avaliativas/modelos/11006/` (campos gerais com `ordem` 1–4, agrupamentos com `ordem` 1–2, dois agrupamentos com o mesmo nome, um `valorMaximo: null`).

## Pedido original

App React Native (Expo, `apps/mobile`) para **avaliadores** entrarem e avaliarem as inscrições das categorias liberadas para avaliação. Banco local WatermelonDB, reuso do tRPC de `packages/api`, tema igual ao `apps/web`. Precisa **funcionar sem internet**.

- Login.
- Barra inferior com 3 itens: categorias, avaliações, configurações.
- Categorias com situação `PRONTA_AVALIACAO` → detalhe com as inscrições (ordenadas por `ordem`) → drawer com detalhes e botão "avaliar".
- Avaliações: o rascunho, inscrições ainda não avaliadas, na fila, com erro, sincronizadas de categoria em andamento e, ocultas, as de categorias encerradas.
- Formulário em etapas, montado a partir do modelo de ficha da categoria; pode ser deixado a qualquer momento; "salvar" coloca na fila.
- Configurações: logout, dados do usuário, limpar dados locais, quantidade não sincronizada, indicador de conexão e última vez online.

## Decidido

- **Destino:** spec de handoff do app — telas, modelo de dados offline, protocolo de sync e política de falhas, e o contrato de API que o app exige. Nada fica por decidir antes de fatiar em issues de implementação.
- **Backend fora do escopo.** A API (Django REST) é do usuário; o que faltar de contrato vira dependência documentada, e os fatos da API são pedidos a ele.
- **Categorias:** por ora lista todas em `PRONTA_AVALIACAO`, sem filtrar por avaliador; o filtro por avaliador vem quando a API tiver o vínculo.
- **Vocabulário** (já em `docs/contextos/avaliacoes/GLOSSARY.md`): Avaliador (jurado é sinônimo a evitar); Avaliação = resultado de um avaliador para uma inscrição; Modelo de ficha = ficha avaliativa (o molde); inscrição é o que se avalia, "apresentação" é só o ato; Rascunho, Avaliação na fila, Avaliação sincronizada, Avaliação com erro.
- **Ordem das inscrições:** atributo `ordem`, que a API já devolve também na modalidade individual.
- **Na fila é editável** até o envio começar; a edição troca o payload e mantém o lugar na fila. Sincronizada é imutável (uma por inscrição, sem PUT).
- **Política de sync (FIFO):**
  - Temporária (sem rede, timeout, 5xx): o item da cabeça fica, a fila pausa e tenta de novo com backoff e quando a conexão volta — detectada com `@react-native-community/netinfo`.
  - 401: pausa a fila inteira e pede novo login; nada se perde.
  - Recusa definitiva (400, 403, 404, 409, categoria encerrada, versão do modelo): o item vai para **com erro**, não trava a fila, exige ação do avaliador (corrigir e salvar de novo → fim da fila, ou descartar). O modelo só é a causa quando o `modeloFichaAvaliativaId` enviado não é compatível com o modelo atual da categoria no banco.
- **Download offline:** automático ao abrir a categoria, mais pull-to-refresh e badge "disponível offline"; ícone simples durante e ao fim do download. Cada refresh **reescreve inteiro** o download anterior, sem restos. Sem download, "avaliar" fica desabilitado.
- **Modelo mudou na API:**
  - avaliação já concluída offline (na fila) → vira com erro pela política acima;
  - rascunho → **congela na hora** (não exclui), impedindo o avaliador de continuar numa versão velha.
- **Um rascunho só.** A fila controla o que espera sync; o rascunho existe para o avaliador não perder a avaliação ao sair da tela.
- **Etapas:** uma etapa por ocorrência de agrupamento, intercaladas com os campos gerais pela ordem; campos gerais consecutivos formam uma etapa (3 gerais, agrupamento com quantidade 1, 3 gerais = 3 etapas).
- **Alternativa única × múltipla:** a API e o web passaram a distinguir `ALTERNATIVA_UNICA` e `ALTERNATIVA_MULTIPLA`. **Aguarda a API**: o payload de envio dos dois casos ainda não existe.
- **Validação no cliente:** obrigatórios; `NUMERICO` entre 0 e `valorMaximo` (sem teto quando nulo), 4 casas; texto livre em descritivo/observação; prévia da nota pela fórmula do exemplo, nota final ≤ 10. Um *builder* modelo de ficha → schema Zod e o cálculo da nota ficam em `packages/schemas`, reutilizáveis pelo web.
- **Logout e "limpar dados" bloqueados** enquanto houver algo na fila ou com erro, salvo confirmação explícita de descarte. Cada avaliação local leva o id do avaliador; só a fila dele é enviada.

## Dependências da API (nada específico do mobile existe hoje)

- POST de avaliação (`.../inscricoes/<id>/avaliacoes/`) — ainda não implementado.
- Payload de resposta para `ALTERNATIVA_UNICA` e `ALTERNATIVA_MULTIPLA`.
- Vínculo avaliador ↔ categoria e listagem das categorias do avaliador (hoje `Categoria.avaliadores` é só um inteiro).
- Listagem de categorias `PRONTA_AVALIACAO` entre eventos.
- **Listagem das avaliações do usuário**: por categoria e paginada no geral. A tela de avaliações do mobile depende dela para saber o que já foi sincronizado (reinstalação, outro aparelho).
- Leitura do modelo de ficha por avaliador sem entidade vinculada.
- (Proposta, ver Q1) `ordem` compartilhada entre campos gerais e agrupamentos.

Já existem e são `publicProcedure` no tRPC: `evento.getAll`, `modalidade.getAll`, `categoria.getAll`, `categoria.getFichaAvaliativa`, `inscricao.getAll`.

## Possível já, sem esperar a API

Login (`signIn.rest`), barra inferior, tela de configurações inteira, WatermelonDB e schema local, indicador de conexão, port do tema, lista de categorias provisória (ver Q10), detalhe da categoria, drawer, download/refresh, renderização do formulário, builder Zod e nota, ciclo do rascunho, motor da fila contra o contrato (envio stubado).

## Rodada 3 — perguntas em aberto (com recomendação)

1. **Intercalar gerais e agrupamentos:** o schema numera `ordem` por coleção (gerais 1–4 e agrupamentos 1–2 colidem no 11006), então a regra de etapas exige `ordem` compartilhada. → Registrar como dependência da API; provisório: todos os gerais numa etapa, depois as ocorrências dos agrupamentos.
2. **Termo para a ocorrência de um agrupamento** (tem `nome` e `ordem`; backend `UnidadeAvaliativa`, payload `unidades[]`). → **Unidade avaliativa** canônico; tirar do _Avoid_ de Agrupamento.
3. **"Por jurado"** na definição original de Agrupamento e no comentário de `ficha-avaliativa.ts`: uso real ou resto? → Resto; manter "por dança, por par, por item".
4. **Nome canônico do molde:** Modelo de ficha (com "ficha avaliativa" a evitar) mesmo com código e API dizendo ficha avaliativa? → Sim.
5. **Rascunho bloqueado:** só leitura com faixa explicando; única ação "descartar e recomeçar na versão nova"; conta como o único rascunho. → Sim.
6. **"Avaliar" outra inscrição com rascunho aberto:** perguntar "continuar o rascunho de X" ou "descartar e começar este". → Sim.
7. **Refresh reescreve tudo × avaliações locais:** cada avaliação local guarda a própria cópia da versão do modelo; com erro por mudança de modelo só pode ser descartada. → Sim aos dois.
8. **Categoria encerrada no refresh:** rascunho dela congela (como 5); na fila segue e o servidor recusa → com erro. → Sim.
9. **Etapa de revisão** com resumo e nota calculada antes de salvar, tocando numa etapa para voltar. → Sim.
10. **Lista provisória de categorias:** fan-out eventos → modalidades → categorias filtrando `PRONTA_AVALIACAO`, atrás de uma função trocável pelo endpoint dedicado. → Sim.
11. **Onde mora a spec final:** este arquivo, indexado pelo mapa no Linear. → Sim.

## Conflitos de glossário levantados

- Agrupamento evitava "unidade avaliativa", mas o backend usa o termo para a ocorrência (Q2).
- "Por jurado" removido da definição de Agrupamento sem confirmação (Q3).
- "Ficha avaliativa" a evitar, mas presente em todo o código e na API (Q4).
- Posição sugeria ordem única no modelo — corrigido para ordem por coleção (abre Q1).
- Quantidade dizia "na ficha avaliativa" no sentido antigo — corrigido para avaliação.
- `GLOSSARY-MAP.md` aponta glossários de eventos e inscrições que não existem; "pronta para avaliação", "encerrada" e "inscrição" ficam sem definição.

## Para o mapa (Notes)

- Registrar a necessidade de **atualizar as versões das dependências de `apps/mobile`** (vira ticket `task`).
- Tickets de pesquisa previstos: WatermelonDB no Expo 57 / RN 0.86 (nova arquitetura, config plugin, dev client); compartilhar os tokens de tema do web com NativeWind.
- Skills a consultar em toda sessão: `grilling`, `domain-modeling`.
