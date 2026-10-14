# Modelo de ficha: o que o editor espera do backend

O editor de `/admin/fichas-avaliativas/criar` (`features/avaliacoes/editor-modelo-ficha/`) foi entregue com as limitações abaixo. Cada uma depende de mudança no `api`. Elas não estão no Linear: o acompanhamento do backend é feito fora dele.

## Ordem única entre campos gerais e agrupamentos

O backend numera `camposGerais` e `agrupamentos` em sequências separadas: `ModeloFichaCampo.ordem` e `ModeloUnidadeAvaliativa.ordem` são únicos cada um na sua tabela, e nada registra se um agrupamento vem antes ou depois de um campo geral. A ficha global "Danças Tradicionais Pré-Mirim" (fixture `modelos-globais.json`) tem campos gerais de 1 a 6 e o agrupamento "Danças" também na ordem 1.

Enquanto isso não muda, o editor:

- desenha todos os campos gerais primeiro e os agrupamentos depois;
- só oferece "Criar agrupamento" depois do último campo geral ou do último agrupamento;
- não deixa arrastar uma posição de uma lista para outra (campo geral ↔ agrupamento, ou agrupamento A → B), só reordenar dentro da mesma lista e reordenar agrupamentos entre si. O bloqueio está em `aceita`, em `lib/arraste.ts`.

Quando o backend tiver uma ordem única, esses três pontos podem ser liberados.

## Leituras que faltam

O viewset `ModeloFichaViewSet` só aceita `post` e `patch`. O editor usa mocks no lugar de:

- **catálogo de campos globais**: `lib/campos-globais-mock.ts`, gerado a partir da fixture. Os ids são os do banco, então o `POST` real aceita os `campoId` do mock;
- **detalhe de um modelo** e **lista de versões de uma família**: sem eles não dá para editar um modelo existente nem criar uma versão nova a partir dele. Por isso a tela de criar não tem o seletor de versão.
