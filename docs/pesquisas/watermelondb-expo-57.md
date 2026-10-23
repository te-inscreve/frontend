# WatermelonDB no Expo 57 / RN 0.86

Pesquisa do ticket [TE-66](https://linear.app/te-inscreve/issue/TE-66), filho do mapa [TE-64](https://linear.app/te-inscreve/issue/TE-64). Fontes consultadas em 21/10/2026.

## Recomendação

**Não usar WatermelonDB. Usar `expo-sqlite` + Drizzle ORM** (`drizzle-orm/expo-sqlite`, com `useLiveQuery` e `useMigrations`).

- O WatermelonDB **roda** em RN 0.81–0.83 com a nova arquitetura, segundo relatos da comunidade. Isso depende de camadas de compatibilidade (interop) e de patches locais. Nenhuma versão estável foi publicada desde abril de 2025, e o mantenedor não responde as issues de nova arquitetura.
- O RN 0.88 (Expo SDK 58) removeu `RCTCxxBridge`, e a versão 0.28.0 **não compila** nele sem patch. Adotar o WatermelonDB hoje significa travar o próximo upgrade do Expo.
- O nosso caso não usa o principal diferencial do WatermelonDB, o protocolo de sync pull/push com `_changes`. Os dados baixados são **reescritos por inteiro** a cada refresh, e o envio é uma **fila FIFO** própria de avaliações. As duas coisas cabem em poucas tabelas SQLite com transações.
- O `expo-sqlite` é first-party do Expo, versionado junto com o SDK (`sdk-57` → `57.0.4`), e funciona na nova arquitetura por construção. O Drizzle cobre o que o WatermelonDB daria de útil: schema tipado, migrações geradas e queries reativas em hook.

Alternativa de reserva: `@op-engineering/op-sqlite`, se um dia a performance de leitura em massa virar gargalo. Ele também é JSI e mantido, mas exige prebuild e tem reatividade mais restrita (detalhes abaixo).

## 1. Estado do WatermelonDB

| Fato | Fonte |
|---|---|
| Última versão estável: `0.28.0` (07/04/2025). Última pré-release: `0.28.1-0` (24/07/2025). Nada publicado desde então. | `npm view @nozbe/watermelondb time` |
| Último commit em `master`: 11/08/2025 (mudança de docs). Há 303 issues abertas. | [GitHub API do repo](https://github.com/Nozbe/WatermelonDB/commits/master) |
| Em nov/2024, o mantenedor (radex) disse não ter tempo para o projeto. A issue de bridgeless continua aberta desde abr/2024. | [#1769](https://github.com/Nozbe/WatermelonDB/issues/1769) |
| A issue "Has WatermelonDB been abandoned?" (abr/2026) não tem resposta dos mantenedores. | [#1963](https://github.com/Nozbe/WatermelonDB/issues/1963) |
| A pergunta sobre o suporte oficial a New Arch / Expo 54+ (jun/2026) também não tem resposta oficial. | [#1969](https://github.com/Nozbe/WatermelonDB/issues/1969) |
| Existe um fork comunitário em reescrita com Nitro Modules, o NitromelonDB (npm `nitromelondb` 0.31.1, out/2026). Tem 34 estrelas e é de um único autor. | [NitromelonDB](https://github.com/StasDoskalenko/NitromelonDB), [#1969](https://github.com/Nozbe/WatermelonDB/issues/1969) |

### Roda na nova arquitetura (Fabric/TurboModules, bridgeless)?

**Roda, mas de forma não oficial e frágil.**

- O RN 0.82 passou a rodar só na nova arquitetura: `newArchEnabled=false` é ignorado ([blog RN 0.82](https://reactnative.dev/blog/2025/10/08/react-native-0.82)). Logo, com o Expo 57 / RN 0.86 não há como desligar a nova arquitetura.
- O WatermelonDB continua sendo um módulo legado (`NativeModules.WMDatabaseBridge`) e depende da camada de interop. No Android, o JSI quebrou no RN 0.74 (sumiu o `getJSIModulePackage`). A `0.28.0-1` passou a registrar o `WatermelonDBJSIPackage` em `getPackages()` ([#1769](https://github.com/Nozbe/WatermelonDB/issues/1769)).
- Relatos de produção na #1769: RN 0.81.5 com Expo 54 e `newArch=true` funcionando, e RN 0.83.2 com o JSI funcionando. Também há relatos de falha no mesmo setup, como `Cannot read property 'initializeJSI' of null` e `NativeModules.WMDatabaseBridge is not defined`, resolvidos com regra de ProGuard (`-keep class com.nozbe.watermelondb.** { *; }`) e ajuste manual no `MainApplication.kt`.
- No modo bridgeless, o reload no Android dava `NullPointerException` em `BridgelessCatalystInstance.getReactQueueConfiguration` dentro de `WMDatabaseBridge.invalidate`. A correção é um patch comunitário (limbo56) que nunca foi lançado em versão estável ([#1769](https://github.com/Nozbe/WatermelonDB/issues/1769)).
- **RN 0.88 / Expo 58:** a `0.28.0` não compila. No iOS, o `RCTCxxBridge` foi removido e é usado em `JSIInstaller.h/.mm` e em `WMDatabaseBridge.m`. No Android, o AGP 9 deixou de gerar `BuildConfig` em bibliotecas. O caminho JSI não foi testado no 0.88 ([comentário em #1969, 19/10/2026](https://github.com/Nozbe/WatermelonDB/issues/1969)). O RN 0.86 ainda declara o `RCTCxxBridge`, então o Expo 57 provavelmente compila. Mesmo assim, o próximo upgrade de SDK já exige `patch-package`.

### Caminho de instalação no Expo

- **Não funciona no Expo Go.** Exige dev client com `npx expo prebuild` / `expo run:*` ou EAS Build.
- A [documentação oficial de instalação](https://watermelondb.dev/docs/Installation) não fala de Expo nem da nova arquitetura. Ela só descreve a edição manual de `settings.gradle`, `build.gradle` e `MainApplication` para o JSI no Android, além do CocoaPods no iOS.
- Config plugin: [`@morrowdigital/watermelondb-expo-plugin`](https://github.com/morrowdigital/watermelondb-expo-plugin) (2.3.3, readme "Tested against Expo SDK 54", último push em jan/2026). Ele instala o JSI no Android automaticamente e aceita `disableJsi`. Também existe um fork comunitário para o SDK 52+ ([LovesWorking/watermelondb-expo-plugin-sdk-52-plus](https://github.com/LovesWorking/watermelondb-expo-plugin-sdk-52-plus)). Nenhum dos dois declara suporte ao SDK 57.
- Babel: precisa de `@babel/plugin-proposal-decorators` com `legacy: true`, porque os models usam decorators ([Installation](https://watermelondb.dev/docs/Installation)).
- Adapter: `SQLiteAdapter({ schema, migrations, jsi: true })`. Se o JSI não carregar, ele cai silenciosamente para o modo assíncrono pela bridge ("JSI SQLiteAdapter not available… falling back").

### Limitações conhecidas

- **React 19:** `@nozbe/with-observables@1.6.0` declara peer `react@^16||^17||^18`, o que conflita com o `react@19.2.8` ([#1956](https://github.com/Nozbe/WatermelonDB/issues/1956)). Contornar exige `overrides`/`resolutions`.
- **Hooks:** não há hook oficial de observação. A API reativa é o HOC `withObservables` (em `src/react` só existem `useDatabase`, `DatabaseProvider` e `withObservables`). Para usar hooks, é preciso escrever um wrapper de RxJS à mão.
- **Hermes:** a documentação só cita o Hermes para Windows. Não há bloqueio conhecido no iOS/Android.
- **Migrações:** são declarativas (`schemaMigrations` com `addColumns`/`createTable`) e só aditivas. Para remover ou renomear uma coluna, é preciso reconstruir a tabela à mão com `unsafeExecuteSql`.
- **Bugs abertos relevantes:** `Cannot assign to read-only property` no Expo 54 e em bulk delete ([#1953](https://github.com/Nozbe/WatermelonDB/issues/1953), [#1941](https://github.com/Nozbe/WatermelonDB/issues/1941)) e falha com EAS Update ([#1954](https://github.com/Nozbe/WatermelonDB/issues/1954)).

## 2. Alternativas

### `expo-sqlite` + Drizzle (recomendada)

- **Instalação:** `npx expo install expo-sqlite`. Vem no Expo Go, e o config plugin só é necessário para opções de build (`useSQLCipher`, `enableFTS`) ([docs expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)). Pelo npm, a versão do SDK 57 é a `57.0.4`.
- **APIs:** síncronas (`getAllSync`, `runSync`) e assíncronas (`getAllAsync`, `runAsync`), além de prepared statements e `withExclusiveTransactionAsync`. Este último serve bem para "apagar tudo e reinserir" o snapshot baixado de forma atômica.
- **Reatividade:** `openDatabaseSync(nome, { enableChangeListener: true })` com `addDatabaseChangeListener`. O Drizzle expõe `useLiveQuery(query)`, que "re-renders automatically when data changes" ([Drizzle + Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)).
- **Migrações:** o `drizzle-kit generate` com `driver: 'expo'` gera SQL versionado, aplicado no app por `useMigrations(db, migrations)`. Precisa de `babel-plugin-inline-import` para `.sql` e de `sourceExts.push('sql')` no Metro ([Drizzle](https://orm.drizzle.team/docs/connect-expo-sqlite)). Sem Drizzle, a documentação do Expo sugere `PRAGMA user_version` no `onInit` do `SQLiteProvider`.
- **Extras:** SQLCipher (útil se as avaliações forem dados sensíveis), extensão de session/changeset e inspeção pelo Drizzle Studio via dev tools do Expo.
- **Tipos compartilhados:** o schema Drizzle é TypeScript puro. Ele pode conviver com os schemas Zod de `packages/schemas` (por exemplo, `drizzle-zod`).

### `@op-engineering/op-sqlite`

- JSI, mantido (18.2.5, set/2026), peers `react: *` e `react-native: *`.
- Não roda no Expo Go: exige prebuild ou dev client.
- Reatividade via `db.reactiveExecute({ query, fireOn, callback })`, que **só dispara em transações** e identifica linhas por `rowid` ([reactive queries](https://op-engineering.github.io/op-sqlite/docs/reactive_queries)).
- O Drizzle tem driver para ele (`drizzle-orm/op-sqlite`), então dá para trocar depois sem reescrever as queries.
- Vale a pena se o volume de inscrições por categoria crescer a ponto de a leitura em massa do `expo-sqlite` pesar. Para o volume esperado de um avaliador, não justifica sair do first-party.

### Outros (descartados para este caso)

- **PowerSync, ElectricSQL, LiveStore:** são motores de sync completos, que exigem um serviço de backend próprio. Ficam fora do escopo, porque a fila FIFO e o refresh total já resolvem o sync.
- **NitromelonDB:** é o fork do WatermelonDB com Nitro e é promissor, mas tem meses de vida e um único mantenedor. Pode ser reavaliado em 2027.

## 3. O que se perde trocando WatermelonDB por expo-sqlite + Drizzle

| Recurso do WatermelonDB | Impacto no app do avaliador |
|---|---|
| Protocolo de sync pronto (`synchronize()` com pull/push e `_status`/`_changed` por registro) | **Nenhum.** Não há sync bidirecional: os downloads são substituídos por inteiro e as avaliações saem por uma fila FIFO própria. Isso vira uma tabela `fila_envio` com `criado_em`, `tentativas` e `ultimo_erro`. |
| Carregamento preguiçoso e observação fina por registro/relação (RxJS) | Baixo. O `useLiveQuery` re-executa a query quando a tabela muda. Com listas de algumas centenas de inscrições, isso é barato. Se pesar, basta paginar ou filtrar no SQL. |
| Models com decorators (`@field`, `@relation`) | Nenhum. O Drizzle dá tipos inferidos do schema, sem decorators e sem a configuração extra do Babel. |
| Adapter LokiJS para web | Nenhum. O app web é o Next.js, e o `expo-sqlite` também tem build web (wasm), se um dia for necessário. |

## 4. Esboço do desenho com expo-sqlite

- Tabelas de snapshot: `categorias`, `inscricoes`, `modelos_formulario`. Cada refresh roda `withExclusiveTransactionAsync`, com `DELETE` e depois inserção em lote, e grava o carimbo do snapshot.
- `avaliacoes`: estado local da avaliação (rascunho ou finalizada).
- `fila_envio`: FIFO por `id` autoincremental. O worker consome o mais antigo, remove em caso de sucesso e incrementa `tentativas` em caso de erro. Ele é disparado pelo `expo-network` quando a conexão volta.
- As telas leem com `useLiveQuery`. As escritas acontecem em transação.
