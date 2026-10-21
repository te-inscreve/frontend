# tRPC do Next ou a API Django direto no app mobile

Pesquisa do ticket [TE-83](https://linear.app/te-inscreve/issue/TE-83), filho do mapa [TE-64](https://linear.app/te-inscreve/issue/TE-64). Fontes consultadas em 21/10/2026. O backend Django está fora do escopo: o que o código deste repo não prova vira **dependência do backend** (seção 10), não dedução.

Arquivos do repo citados: `apps/mobile/src/utils/api.tsx` (o ticket diz `api.ts`), `apps/mobile/src/utils/auth.ts`, `packages/api/src/trpc.ts`, `packages/api/src/rest-error.ts` (o ticket o situa em `packages/auth`), `packages/auth/src/rest-credentials.ts`, `packages/rest/src/*`, `apps/web/src/app/api/trpc/[trpc]/route.ts`, `apps/web/src/shared/api/http-client.ts` e `docs/planos/app-avaliador-mobile.md`.

## Recomendação

**Manter o tRPC do Next no v1, endurecer três pontos e isolar o transporte da fila atrás de uma porta, para trocar só o envio por chamada direta se um gatilho concreto aparecer.**

1. **O intermediário custa disponibilidade, não correção.** A fila FIFO já trata "sem resposta" como temporária (pausa, backoff, netinfo). "Next fora do ar com Django no ar" cai no mesmo tratamento que "sem rede". O que pesa de verdade é o que o tRPC *esconde* da fila (seção 5) e o cookie renovado que não chega ao aparelho (seção 4), e os dois têm conserto pequeno do nosso lado.
2. **A fidelidade de status hoje é insuficiente para a fila, mas é corrigível no servidor.** `toTRPCError` perde ou deturpa o status original em quatro casos (seção 5). Expor o status do Django em `error.data` (`upstreamStatus`, `retryAfter`) no `errorFormatter` dá à fila o mesmo dado que ela teria numa chamada direta.
3. **Ir direto troca um problema por quatro**: guardar e renovar o JWT no aparelho sem o better-auth, perder o `AppRouter`, tirar o `X-API-KEY` do bundle (o `httpClient` do web o envia em toda chamada) e manter outro cliente tipado. Cada um depende de fatos do backend que não temos.
4. **Híbrido "leitura pelo tRPC, envio direto"** é a saída de escape natural, mas só compensa quando o envio direto for necessário (gatilhos abaixo): ele obriga a ter a gestão de JWT no aparelho, que é a parte cara da opção direta. O híbrido inverso (envio pelo tRPC, leitura direta) não tem vantagem.

**Gatilhos para migrar o envio para direto:** (a) incidente real de Next fora do ar com Django no ar durante o sync; (b) o backend aceitar chamadas do mobile sem `X-API-KEY` compartilhado (ou com chave por cliente) *e* expor refresh de JWT utilizável pelo app; (c) a correção da seção 5 não bastar na prática.

## 1. Como é hoje

- O app cria um `httpBatchLink` em `<Next>/api/trpc` com `superjson`, mandando o `Cookie` de `authClient.getCookie()` (`apps/mobile/src/utils/api.tsx`).
- No Next, `createTRPCServerContext` chama `auth.api.getSession({ headers })`, tira `session.session.token` (o JWT do Django) e faz `restClient.withToken(token)` (`packages/api/src/trpc.ts`). Os procedures falam com o Django por `ctx.restClient`; não há banco.
- O `httpClient` do web envia `X-API-KEY: env.API_KEY` em **toda** chamada ao Django, tem `timeout: 15_000` e lê o `csrftoken` do cookie do Next (`apps/web/src/shared/api/http-client.ts`). `packages/rest/env.ts` descreve `API_KEY` como a chave que "the backend REST API expects".
- O login (`signIn.rest`) é um endpoint do plugin `restCredentials`, que chama `/auth/login` no Django e grava o JWT em `session.token` no cookie JWE do better-auth. O refresh (`/auth/token/refresh`, corpo `{ refresh }`, resposta `{ access, refresh? }`) acontece **dentro do `get-session` do Next**, quando faltam 60 s ou menos para o `exp`, e usa o cookie `rest_refresh` (`packages/auth/src/rest-credentials.ts`).
- Uso real do tRPC no mobile hoje: `listarCategoriasProntas` (fan-out de `evento.getAll`, `modalidade.getAll`, `categoria.getAll`, todos `publicProcedure`) e `signIn.rest`. O envio da avaliação ainda não existe no router nem na API.

## 2. Custo do intermediário

**Fatos:**
- Cada chamada tem um salto a mais (app → Next → Django) e um timeout próprio de 15 s no Next (`http-client.ts`). Se o Django demora e o Next desiste, o app vê erro mesmo que o Django conclua depois (risco de envio duplicado; seção 8).
- O servidor Next precisa estar no ar. Para o app offline-first isso só importa nas janelas de sync e de download da categoria, as únicas em que o app fala com a rede (spec: "Download offline: automático ao abrir a categoria" e fila FIFO).
- A política de sync da spec já trata "sem rede, timeout, 5xx" como temporária: o item da cabeça fica e a fila tenta de novo. Um Next fora do ar chega ao app como falha de transporte ou resposta não-JSON de proxy (seção 5), isto é, temporária. **Não existe um modo de falha novo para a fila**, só mais chances de cair no modo já tratado.
- O Expo descreve o local-first assim: leituras e escritas vão ao banco local, ações remotas são escritas no banco primeiro e rastreadas como na fila/enviando/aceita/falhou, e a disponibilidade de outra máquina "should never prevent you from working" ([Expo local-first](https://docs.expo.dev/guides/local-first/)). A página não discute BFF vs backend direto.

**Sem dados:** a latência real do salto extra e a disponibilidade do deploy do Next. Se o deploy do Next for serverless com timeout de função menor que o do Django para o POST de avaliação, isso é um risco de produção a verificar (infraestrutura, não backend Django).

## 3. Ganhos do intermediário e o que o mobile realmente usa

| Ganho | Usado pelo mobile hoje? |
|---|---|
| Tipos de ponta a ponta (`AppRouter`, `RouterInputs`/`RouterOutputs`) | Sim. `@te-inscreve/api` é devDependency do mobile só pelos tipos (`api.tsx`). |
| Reuso dos routers e do cache de 30 s/tags do Next | Parcial. As leituras reaproveitam os procedures; o cache (`next: { revalidate, tags }`) é do servidor e não ajuda o app offline, que guarda o próprio download no SQLite. |
| `superjson` | Instalado nos dois lados, mas os schemas de `packages/schemas` trafegam decimais como string (`"10.0000"`); nada visto no mobile depende de `Date`/`Map` serializados. Sem tRPC, some sem perda aparente. |
| Tratamento de erro (`rest-error.ts`, `fieldErrors`) | O app não tem formulário com erro de campo do Django (o login passa pelo better-auth, não pelo tRPC). Para a fila importa o **status**, que é justamente o que o `toTRPCError` degrada (seção 5). |
| Uma só camada de auth | Sim, e é o ganho mais valioso: login, SecureStore, refresh e `X-API-KEY` ficam no Next. |

Resumo: dos ganhos, dois são relevantes para o mobile (tipos e auth única). O reuso do tratamento de erro do web tem **efeito negativo** para a fila.

## 4. Autenticação direta (sem better-auth)

Como seria: o app chama `/auth/login` do Django, guarda `access` e `refresh` no `expo-secure-store`, injeta `Authorization: Bearer` e renova antes de expirar, reaproveitando `readJwtExpiry` e o formato `{ access, refresh }` já assumidos em `rest-credentials.ts`.

Fatos primários:
- `expo-secure-store` é a recomendação do Expo para tokens ([Expo authentication](https://docs.expo.dev/guides/authentication/)). No Android é SharedPreferences cifrado pelo Keystore; no iOS o item pode sobreviver à desinstalação, mas isso não deve ser usado como garantia; o Expo não impõe limite de tamanho, embora iOS antigos tenham recusado valores acima de ~2048 bytes ([SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)). Dois tokens JWT cabem; o cookie JWE do better-auth (JWT mais dados do usuário) é maior e vale medir no aparelho.
- A página de autenticação do Expo diz que o cliente não é lugar seguro para segredos e que a troca deve ocorrer em servidor (API routes ou RSC). O `X-API-KEY` compartilhado é desse tipo: **num bundle mobile ele seria extraível**. A chamada direta só é segura se o backend deixar de depender dele para o mobile (seção 10).
- Defaults do simplejwt (se o Django o usar; **não confirmado**, seção 10): access de 5 min, refresh de 1 dia, `ROTATE_REFRESH_TOKENS=False`, `BLACKLIST_AFTER_ROTATION=False`; com rotação, o refresh devolve um novo `refresh`, e a blacklist só vale com o app `token_blacklist` instalado ([simplejwt settings](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html)). Duas consequências valem para **qualquer** opção:
  - O access expira em minutos: ao voltar a rede com a fila cheia, **o primeiro passo do flush é renovar o token**, não enviar. Sem rede para renovar, nada é enviado.
  - Quanto tempo o aparelho pode ficar offline sem perder a sessão é o `REFRESH_TOKEN_LIFETIME` do backend (1 dia no default). Passado isso, o refresh dá 401 e o avaliador precisa logar de novo, com a fila retida (spec: "401: pausa a fila inteira e pede novo login; nada se perde").
- O que mudaria no app: remover `@better-auth/expo` do mobile (ou mantê-lo só para o login), criar um módulo de token com mutex de refresh (uma renovação por vez, as demais esperam) e um interceptor de fetch que, em 401, renova uma vez e repete; se a renovação der 401, dispara o evento "pausa a fila e pede login". O web continua com better-auth.

**Achado no caminho atual (tRPC):** o plugin do better-auth para Expo só grava o `Set-Cookie` das respostas que passam pelo pipeline de fetch do `authClient` (hook `onSuccess` do plugin; `getCookie()` lê o que foi gravado) ([código do plugin](https://github.com/better-auth/better-auth/blob/main/packages/expo/src/client.ts), [docs Expo](https://www.better-auth.com/docs/integrations/expo)). O `httpBatchLink` usa `fetch` puro com o `Cookie` manual, então o cookie renovado pelo `getSession` **do lado do Next** numa chamada tRPC *não chega* ao aparelho. Isto é inferência do código lido, **a confirmar em dispositivo**. Se for verdade, enquanto o cookie guardado estiver velho cada chamada tRPC dispara um refresh novo no Next a partir do `rest_refresh` antigo; com rotação + blacklist no backend, a segunda renovação com o mesmo refresh falharia com 401 e o `rest-credentials` limparia a sessão. **Mitigação barata:** antes de cada flush (e ao receber 401), o app chama `authClient.getSession({ query: { disableCookieCache: true } })` pelo cliente do better-auth, que grava o cookie novo, e só então envia.

## 5. Classificação dos erros do envio: qual caminho preserva o status

Classes da spec: temporária (sem rede, timeout, 5xx), 401 e recusa definitiva (400, 403, 404, 409, categoria encerrada, versão do modelo).

### Chamada direta (`@te-inscreve/rest`)
O `HttpClient` devolve `Result` com `NetworkError` (status `null`) ou `HttpError` com `status` exato, `data` (corpo bruto do DRF) e `retryAfter` no 429 (`errors.ts`, `http-client.ts`). `matchHttpError` obriga a cobrir todos os ramos. **Fidelidade total** do status e do corpo. O pacote não depende de `next/headers` (o CSRF é o hook opcional `getCsrfToken`), então roda no RN; o que oferecem o `fetch`, o `AbortController` e o `Headers` do SDK 57 fica **a verificar em aparelho**. Se o Django usa JWT por `Authorization`, o CSRF do DRF (que só se aplica à `SessionAuthentication`) não entra; confirmar (seção 10).

### Pelo tRPC
O tRPC mapeia códigos para status HTTP e o cliente recebe `error.data.code` e `error.data.httpStatus` ([error handling](https://trpc.io/docs/server/error-handling)). Falhas de transporte ou resposta que não seja uma resposta de erro do tRPC viram `TRPCClientError` **sem `data`** (`TRPCClientError.from` só preenche `data` a partir de uma resposta de erro tRPC; o resto vai para `cause`) ([fonte](https://github.com/trpc/trpc/blob/main/packages/client/src/TRPCClientError.ts)). Num lote com status distintos a resposta HTTP é `207`, mas cada item traz o próprio `data.httpStatus` ([getHTTPStatusCode](https://github.com/trpc/trpc/blob/main/packages/server/src/unstable-core-do-not-import/http/getHTTPStatusCode.ts)); a fila deve ler o status por item, nunca o do lote.

Onde o `toTRPCError` (`packages/api/src/rest-error.ts`) perde fidelidade, lido no código:

| Situação no Django | O que o app vê | Efeito na fila |
|---|---|---|
| Qualquer 5xx (500, 502, 503, 504) | `INTERNAL_SERVER_ERROR` (500) | Correto (temporária), mas o status original some. |
| Falha de rede entre Next e Django | `INTERNAL_SERVER_ERROR` (500), igual ao 5xx | Indistinguível de 5xx; para a fila tudo bem (ambos temporários). |
| 4xx sem entrada em `STATUS_TO_TRPC` (por exemplo 406, 410, 415, 423) | `INTERNAL_SERVER_ERROR` (500) | **Recusa definitiva classificada como temporária.** O item travaria a cabeça da fila. |
| 5xx cujo corpo tem `fieldErrors` (ex.: envelope `server_error` do drf-standardized-errors, que `isResponseError` aceita) | `BAD_REQUEST` (400): o ramo `fieldErrors` faz `STATUS_TO_TRPC[status] ?? "BAD_REQUEST"` | **Falha temporária classificada como recusa definitiva.** A avaliação iria para "com erro" por causa de um 500. Depende de o backend responder 5xx nesse formato (seção 10), mas o código não impede. |
| 429 | `TOO_MANY_REQUESTS`, sem `Retry-After` | Temporária (correto), sem o intervalo que o Django mandou. |
| 401 do Django (JWT rejeitado) ou sessão ausente no Next | `UNAUTHORIZED` nos dois casos | Correto para pausar a fila, mas não diz qual. |

A correção é nossa e pequena: no `errorFormatter` de `trpc.ts`, acrescentar a `data` o **status original** (`upstreamStatus: number | null` e `retryAfter`), lido de `error.cause` quando for `HttpError`, e `null` para `NetworkError`. O mobile passa a classificar por `upstreamStatus` (e `data === undefined` ⇒ transporte) em vez de pelo `code`. Corrigir também o ramo `fieldErrors` para só virar `BAD_REQUEST` quando o status for 4xx. Com isso o tRPC fica equivalente à chamada direta para a decisão da fila.

Conclusão: **a chamada direta preserva a fidelidade por construção; o tRPC só com essa correção.** Como a correção é local e testável, a fidelidade sozinha não justifica abandonar o tRPC.

## 6. Tipos sem tRPC

| Opção | Cobre | Custo de manter |
|---|---|---|
| Cliente `@te-inscreve/rest` compartilhado + genéricos manuais (`rest.get<Categoria[]>`) | Já existe e é o que os routers usam por dentro. | Nada garante que o genérico bate com o corpo; é o que se faz hoje nos routers. |
| Schemas Zod de `packages/schemas` + `.parse` na resposta | Valida em tempo de execução e é a fonte única já adotada. Os mesmos schemas servem web e mobile. | Um schema escrito à mão por endpoint. Para a fila, o parse do payload de envio e do modelo de ficha já está previsto na spec (builder de Zod em `packages/schemas`). |
| OpenAPI via drf-spectacular + `openapi-typescript` (+ `openapi-fetch`) | Gera OpenAPI 3.0/3.1 e tipos "runtime-free"; camelCase via hook de pós-processamento do `djangorestframework-camel-case` ([drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/readme.html), [openapi-typescript](https://openapi-ts.dev/introduction)). | Exige o backend publicar e manter o schema, e um passo de geração no CI. Só vale se o backend adotar (dependência do backend). |

Para a opção direta: schemas Zod de `packages/schemas` para o que o app **valida** (envio e modelo de ficha) mais o `HttpClient` como transporte; OpenAPI só se o backend já publicar o schema.

## 7. Caminho híbrido

- **Leitura pelo tRPC, envio direto:** aproveita os procedures e os tipos no download e dá ao envio a fidelidade exata. Custo: o envio precisa do JWT no aparelho, ou seja, a gestão de token da seção 4 *inteira* (login do Django, refresh, mutex, SecureStore) e a saída do `X-API-KEY` do caminho do mobile. Só compensa se a correção da seção 5 não bastar ou se o Next fora do ar virar problema medido.
- **Leitura direta, envio pelo tRPC:** sem vantagem. Ganha-se no que menos importa (a leitura acontece online) e mantém-se o problema do envio.
- **Ponto fraco do híbrido:** duas rotas de auth no app (cookie do better-auth para o tRPC e token próprio para o Django), a menos que o login também migre. Se o envio migrar, o login deve migrar junto.

## 8. O que apps offline-first fazem

Não foi achada fonte primária que compare BFF em Next com backend direto para apps Expo offline-first. A documentação do Expo não discute BFF vs direto e só recomenda trocar segredos em servidor. O que a fonte primária diz e vale aqui:
- Ações remotas são escritas primeiro no banco local e rastreadas por estado (na fila, enviando, aceita, falhou); o app continua usável com o servidor fora ([Expo local-first](https://docs.expo.dev/guides/local-first/)). A spec já segue isso.
- TanStack Query pausa mutations sem conexão no modo `online` (padrão) e, no `always`, ignora o estado de conexão ([network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)). A fila do app é própria (SQLite); o transporte, tRPC ou direto, é detalhe de quem chama.
- **Idempotência do envio:** a spec diz "uma [avaliação] por inscrição, sem PUT". Se o POST conclui no Django mas a resposta se perde (timeout de 15 s do Next, queda de rede), o reenvio devolve uma recusa; qual status é dependência do backend. O intermediário aumenta essa janela, mas ela existe nas duas opções: a fila precisa tratar "recusa de reenvio de algo que eu mandei".

## 9. O que mudaria em cada opção

### Opção A: manter o tRPC (recomendada)
- `packages/api`: `trpc.ts` (`errorFormatter` expõe `upstreamStatus`/`retryAfter`) e `rest-error.ts` (ramo `fieldErrors` só vira 400 para 4xx; 4xx desconhecido mapeia para um código 4xx genérico em vez de 500). Router novo `avaliacao.enviar` como `authenticatedProcedure`.
- `packages/auth`: nada. Opcional: helper que renova a sessão via `authClient.getSession` antes do flush.
- `apps/mobile`: motor da fila com uma **porta** `enviar(avaliacao): Promise<Resultado>`, onde `Resultado` é `ok | temporario | nao_autenticado | recusado`; o adaptador tRPC lê `error.data?.upstreamStatus` e trata `data === undefined` como transporte. Envio sem batch (`httpLink` ou `splitLink`), já que a fila envia um item por vez.
- Backend: nada além do já listado na spec.

### Opção B: tudo direto
- `apps/mobile`: remove `httpBatchLink`, `AppRouter` e (se o login migrar) `@better-auth/expo`; novo módulo de token (SecureStore, refresh com mutex); `@te-inscreve/rest` para leitura e envio; schemas Zod para validar respostas.
- `packages/rest`: já serve; o app injeta `baseUrl`, `token` e `fetch`, e o `X-API-KEY` não pode ser obrigatório para o mobile.
- `packages/api` e `packages/auth`: sem mudança para o mobile; os routers passam a servir só o web.
- `packages/schemas`: ganha schemas de resposta para tudo que o app lê.
- Backend: seção 10, itens 1 a 3 e 8.

### Opção C: híbrido (leitura tRPC, envio direto)
Soma da A para leitura e da B para envio e auth; só vale pelos gatilhos da recomendação.

## 10. Dependências do backend (a confirmar com quem mantém a API)

1. **`X-API-KEY`:** é exigido em todas as rotas, inclusive login e refresh? O backend aceita requisições do mobile sem a chave, ou com chave por cliente? (Bloqueia B e C.)
2. **Esquema de JWT:** é simplejwt? Valores reais de `ACCESS_TOKEN_LIFETIME` e `REFRESH_TOKEN_LIFETIME`; `ROTATE_REFRESH_TOKENS` e blacklist ligados? (Define o tempo máximo offline e o risco da seção 4.) Os caminhos `/auth/login`, `/auth/registration`, `/auth/token/refresh` e a forma `{ token, refreshToken, user }` são **suposições** de `rest-credentials.ts`, configuráveis lá.
3. **CSRF:** o Django exige `X-CSRFToken` em chamadas com `Authorization: Bearer`? (Se só vale em `SessionAuthentication`, a chamada direta não precisa; o web o envia por hábito.)
4. **Formato de erro em 5xx:** o backend responde 5xx no envelope `server_error` do drf-standardized-errors? (Define se a deturpação 5xx → 400 da seção 5 ocorre hoje.)
5. **Recusa de reenvio:** o POST `.../inscricoes/<id>/avaliacoes/` responde 409 (ou outro status identificável) quando a avaliação do mesmo avaliador já existe, e traz o id da existente? Aceita chave de idempotência? (Necessário para a fila tratar "resposta perdida" sem marcar "com erro".)
6. **Códigos de recusa:** que status o envio usa para categoria encerrada e versão do modelo incompatível (400/409/422)? A spec lista 400/403/404/409 como definitivos; confirmar que nenhum é usado de forma transitória.
7. **429 e `Retry-After`:** há throttling no envio? A fila deve respeitar o intervalo.
8. **Schema OpenAPI:** o backend publica (ou publicaria) drf-spectacular? Só relevante para tipos gerados.

As demais dependências do app (POST de avaliação, listagens, vínculo avaliador ↔ categoria, alternativa única × múltipla) já estão em `docs/planos/app-avaliador-mobile.md` e valem para as duas opções.

## Lacunas e o que verificar em aparelho

- Confirmar a inferência da seção 4: o cookie renovado numa resposta tRPC não é gravado no SecureStore.
- Latência real do salto extra e disponibilidade do deploy do Next (sem dados).
- Tamanho do cookie JWE do better-auth no SecureStore em aparelhos reais.
- O que o `fetch` do RN no SDK 57 devolve em falha de rede e se honra o `AbortController` do timeout do `HttpClient`; `mensagem-de-erro-login.ts` já nota que o erro varia por runtime.

## Fontes

- Repo: arquivos listados no início.
- tRPC: [error handling](https://trpc.io/docs/server/error-handling), [httpBatchLink](https://trpc.io/docs/client/links/httpBatchLink), [TRPCClientError.ts](https://github.com/trpc/trpc/blob/main/packages/client/src/TRPCClientError.ts), [getHTTPStatusCode.ts](https://github.com/trpc/trpc/blob/main/packages/server/src/unstable-core-do-not-import/http/getHTTPStatusCode.ts)
- better-auth: [Expo](https://www.better-auth.com/docs/integrations/expo), [session management](https://www.better-auth.com/docs/concepts/session-management), [plugin Expo (client.ts)](https://github.com/better-auth/better-auth/blob/main/packages/expo/src/client.ts)
- Expo: [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [authentication](https://docs.expo.dev/guides/authentication/), [local-first](https://docs.expo.dev/guides/local-first/)
- Django: [simplejwt settings](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html), [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/readme.html), [openapi-typescript](https://openapi-ts.dev/introduction)
- [TanStack Query: network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
