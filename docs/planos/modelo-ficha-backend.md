# Modelo de ficha: o que o editor espera do backend

O editor de `/admin/fichas-avaliativas/criar` (`features/avaliacoes/editor-modelo-ficha/`) foi entregue com as limitações abaixo. Cada uma depende de mudança no `api`. Elas não estão no Linear: o acompanhamento do backend é feito fora dele.

## Ordem única entre campos gerais e agrupamentos

Resolvido: o backend agora recusa uma `ordem` repetida entre `camposGerais` e `agrupamentos` — os dois dividem uma sequência só. O editor numera os dois juntos (`paraCriarModeloFicha`), `criarModeloFichaSchema` tem a mesma regra, e um agrupamento pode ir para qualquer ponto da ficha: entre dois campos gerais, por arraste, e o "+" debaixo de um agrupamento cria ali um campo geral ou outro agrupamento.

Continua de fora: arrastar um campo de uma lista para outra (campo geral → agrupamento, ou agrupamento A → B). O bloqueio está em `aceita`, em `lib/arraste.ts`.

## Leituras que faltam

O viewset `ModeloFichaViewSet` só aceita `post` e `patch`. O catálogo de campos globais já vem do `GET campos/` (`fichaAvaliativa.getCamposGlobais`); ainda faltam:

- **detalhe de um modelo** e **lista de versões de uma família**: sem eles não dá para editar um modelo existente nem criar uma versão nova a partir dele. Por isso a tela de criar não tem o seletor de versão.
