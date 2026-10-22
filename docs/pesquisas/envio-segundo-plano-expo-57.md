# Envio da fila em segundo plano no Expo 57

Pesquisa do ticket [TE-92](https://linear.app/te-inscreve/issue/TE-92). Fontes consultadas em 22/10/2026. Versões conferidas contra o SDK 57: `expo-background-task@57.0.21`, `expo-task-manager@57.0.21`, `expo-secure-store@57.0.4`, `expo-file-system@57.0.7`, `expo-modules-core@57.0.24` (dist-tag `sdk-57` no npm; o código lido é o do pacote publicado e o do branch [`sdk-57`](https://github.com/expo/expo/tree/sdk-57) do repo do Expo). A documentação "latest" do Expo já é a do SDK 58; as citações abaixo usam a página [v57.0.0](https://docs.expo.dev/versions/v57.0.0/sdk/background-task/).

Decisões já tomadas, fora de discussão aqui: o processo de segundo plano é leve e **não abre o SQLite**, recebe payloads prontos e só os envia; código nativo é aceitável; abrir o app sempre sincroniza, então o envio em segundo plano é *best-effort*.

Arquivos do repo citados (branch `feat/avaliacoes`): `apps/mobile/src/utils/api.tsx` (o ticket diz `api.ts`), `apps/mobile/src/utils/auth.ts`, `apps/mobile/app.config.ts`, `packages/auth/src/index.ts`, `packages/auth/src/rest-credentials.ts`, `docs/planos/app-avaliador-mobile.md`, `docs/planos/exemplo-frontend-envio-avaliacao.md` e a pesquisa [`trpc-vs-django-direto.md`](https://github.com/te-inscreve/frontend/blob/research/trpc-vs-django-direto/docs/pesquisas/trpc-vs-django-direto.md) (TE-83).

## Recomendação

**Um módulo Expo local (`modules/envio-fila`, Kotlin + Swift) que é o único remetente da fila, com um mecanismo diferente por plataforma. Exige dev client; não roda no Expo Go.**

- **Android: WorkManager nativo.** Um `CoroutineWorker` em `OneTimeWorkRequest` com nome único, `NetworkType.CONNECTED` e sem atraso inicial. Ele drena os arquivos da fila em ordem e é enfileirado sempre que um item entra na fila, ao abrir o app e ao ir para segundo plano. O WorkManager persiste o pedido entre reinícios do processo e do aparelho e o roda assim que houver rede (respeitando Doze e buckets). Nenhum runtime JS é iniciado.
- **iOS: upload em `URLSession` de background**, uma tarefa `uploadTask(with:fromFile:)` por avaliação, criada **no momento em que o item entra na fila, com o app em primeiro plano**. A transferência roda em outro processo do sistema, espera a conectividade sozinha e continua com o app suspenso ou encerrado pelo sistema. O sistema relança o app em segundo plano só para entregar o resultado ao delegate nativo. `BGTaskScheduler` não é necessário.
- **O processo nativo só fala HTTP e arquivo.** O app grava um arquivo por item (requisição tRPC já serializada) e lê, na próxima abertura, um arquivo de resultado por item (`enviada`, `recusada` com status HTTP, `falhou`, `nao_autenticado`).
- **Auth:** continuar com o cookie do better-auth via Next. O cookie vai como header opaco: no iOS ele entra na requisição na criação da tarefa; no Android o app o entrega num arquivo próprio. Nenhum processo de segundo plano lê o Keychain ou o SecureStore. O 401 para o dreno, grava `nao_autenticado` e espera o app abrir para pedir login. O envio em segundo plano **não** torna a API Django direta mais atraente; ele a torna mais cara (seção 6).

**Plano B, sem código nativo:** `expo-background-task` + `expo-file-system`. Ele funciona e roda até no Expo Go, mas o Android só tenta depois de ≥ 15 min (o padrão do código é 24 h). No iOS ele vira `BGProcessingTask`, que roda quando o aparelho está ocioso (na prática, de madrugada). Ele também sobe o bundle JS inteiro e esbarra no Keychain `WHEN_UNLOCKED` (seção 1.1 e seção 5). Serve como paliativo se o módulo nativo atrasar, não como solução.

## 1. Mecanismos

### 1.1 `expo-background-task` (+ `expo-task-manager`)

Fatos da [doc do SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/background-task/) e do código do pacote:

| Item | Android | iOS |
|---|---|---|
| API por baixo | WorkManager: `OneTimeWorkRequest` com `setInitialDelay(minimumInterval)` e `NetworkType.CONNECTED`, re-enfileirado ao terminar ([`BackgroundTaskScheduler.kt`](https://github.com/expo/expo/blob/sdk-57/packages/expo-background-task/android/src/main/java/expo/modules/backgroundtask/BackgroundTaskScheduler.kt)) | `BGProcessingTaskRequest` com `requiresNetworkConnectivity = true` e `earliestBeginDate = agora + intervalo` ([`BackgroundTaskScheduler.swift`](https://github.com/expo/expo/blob/sdk-57/packages/expo-background-task/ios/BackgroundTaskScheduler.swift)) |
| Intervalo mínimo | 15 min ("minimum 15 minutes") | Sem mínimo formal. O sistema ignora intervalos curtos e costuma rodar "overnight" |
| Intervalo padrão | A doc diz 12 h, mas o código usa `DEFAULT_INTERVAL_MINUTES = 60L * 24L` (24 h). **Divergência entre doc e código**: passar `minimumInterval` explícito | 12 h (`12 * 60 * 60` no código) |
| Quem decide | O WorkManager, depois do intervalo e com rede | O `BGTaskScheduler`, por bateria, rede e padrão de uso |
| Tempo de execução | Até 10 min por execução de worker (seção 1.3) | `BGProcessingTask` "can run for minutes", mas "run only when the device is idle" e é encerrada quando o usuário volta a usar o aparelho ([BGProcessingTask](https://developer.apple.com/documentation/backgroundtasks/bgprocessingtask)). Há `addExpirationListener` |
| Com o app em primeiro plano | **Não roda**: o worker vê `inForeground` e se reagenda para daqui a `min(60, intervalo)` min (código acima) | N/A |
| Usuário tira o app dos recentes | "removing the app from recent apps does not fully stop it", mas varia por fabricante (doc) | "swiping it away in the app switcher fully terminates it" (doc). A tarefa só volta depois que o usuário reabre o app |
| Expo Go | "Included in Expo Go" (doc). O `TaskManager` avisa que no Expo Go ele "is not available on Android, and does not support background execution on iOS" ([TaskManager](https://docs.expo.dev/versions/v57.0.0/sdk/task-manager/)). Na prática, exige dev build | Igual |
| Config | Nenhuma | `UIBackgroundModes: processing` e `BGTaskSchedulerPermittedIdentifiers: com.expo.modules.backgroundtask.processing`, aplicados pelo prebuild (CNG). Não funciona no simulador |

Como o JS roda: `TaskManager.defineTask` "must be called in the global scope", porque o app sobe sem montar componentes ([TaskManager](https://docs.expo.dev/versions/v57.0.0/sdk/task-manager/)). No Android, o `TaskService` carrega o app por um `HeadlessAppLoader` e registra uma `HeadlessJsTask` para manter os timers do JS vivos ([`TaskService.java`](https://github.com/expo/expo/blob/sdk-57/packages/expo-task-manager/android/src/main/java/expo/modules/taskManager/TaskService.java)). No iOS, o sistema lança o processo do app inteiro em segundo plano. Nos dois casos, o bundle JS completo é avaliado.

### 1.2 `expo-task-manager` isolado

Ele não agenda nada sozinho. É a infraestrutura que executa JS para quem agenda (`expo-background-task`, localização, notificações). Os limites são os do módulo que o usa.

### 1.3 WorkManager nativo (Android)

- **Uma execução só** (`OneTimeWorkRequest`) com `Constraints.setRequiredNetworkType(NetworkType.CONNECTED)`. Sem `setInitialDelay`, ela roda assim que a restrição for atendida. O mínimo de 15 min vale só para trabalho periódico: "The minimum repeat interval that can be defined is 15 minutes" ([Define work](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work)).
- **Persistência:** o trabalho agendado fica no SQLite interno do WorkManager e é "rescheduled across device reboots" ([Persistent work](https://developer.android.com/develop/background-work/background-tasks/persistent)).
- **Tempo:** "A ListenableWorker is given a maximum of ten minutes to finish its execution", e depois disso ele é sinalizado para parar ([`ListenableWorker.java`](https://github.com/androidx/androidx/blob/androidx-main/work/work-runtime/src/main/java/androidx/work/ListenableWorker.java)).
- **Backoff de `Result.retry()`:** exponencial de 30 s por padrão, mínimo de 10 s e máximo de 5 h (`DEFAULT_BACKOFF_DELAY_MILLIS`, `MIN_BACKOFF_MILLIS`, `MAX_BACKOFF_MILLIS` em [`WorkRequest.kt`](https://github.com/androidx/androidx/blob/androidx-main/work/work-runtime/src/main/java/androidx/work/WorkRequest.kt)).
- **Doze:** com o aparelho parado, o sistema "Suspends network access" e "Doesn't let JobScheduler run. WorkManager uses JobScheduler internally". O trabalho espera a próxima janela de manutenção ([Doze](https://developer.android.com/training/monitoring-device-state/doze-standby)).
- **Buckets de standby** (aproximados, "not guaranteed"; [power-details](https://developer.android.com/topic/performance/power/power-details)):

  | Bucket | Jobs normais | Rede |
  |---|---|---|
  | Active | até 20 min a cada 60 min (Android 16+) | livre |
  | Working set | até 10 min a cada 4 h | livre |
  | Frequent | até 10 min a cada 12 h | livre |
  | Rare | até 10 min a cada 24 h | desabilitada |
  | Restricted | uma vez por dia, até 10 min | desabilitada |

  Com o aparelho carregando, os limites somem (exceto no bucket restricted). Um avaliador usa o app várias vezes por dia durante um evento, então o caso típico é active ou working set.
- **Usuário tira o app dos recentes:** no Android puro o trabalho continua (vale a mesma frase da doc do Expo). **Forçar parada** (Configurações → Forçar parada) cancela tudo: "Alarms and Jobs get cancelled when an application is force-stopped". O WorkManager só reagenda quando o app abre de novo ([`ForceStopRunnable.java`](https://github.com/androidx/androidx/blob/androidx-main/work/work-runtime/src/main/java/androidx/work/impl/utils/ForceStopRunnable.java)). No Android 15, o app fica no estado *stopped* até uma ação do usuário ([mudanças do Android 15](https://developer.android.com/about/versions/15/behavior-changes-all)).
- **Fabricantes:** a Samsung põe apps sem uso em "sleeping/deep sleeping apps" (por volta de 3 dias sem abrir, conforme a versão) e restringe o trabalho em segundo plano. Fonte comunitária, não oficial: [dontkillmyapp.com/samsung](https://dontkillmyapp.com/samsung). Durante um evento isso não deve ocorrer, mas o app não deve depender do segundo plano para nada crítico (já decidido).
- **Expo Go:** não serve, porque é código nativo próprio.

### 1.4 `BGProcessingTask` e `BGAppRefreshTask` (iOS)

- `BGAppRefreshTask`: "up to 30 seconds of background runtime", e o sistema escolhe quando ([Choosing background strategies](https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app)).
- `BGProcessingTask`: minutos, mas só com o aparelho ocioso, e é interrompida quando o usuário volta a usar o aparelho ([BGProcessingTask](https://developer.apple.com/documentation/backgroundtasks/bgprocessingtask)).
- Nenhuma das duas é periódica de verdade. Segundo o DTS da Apple, quem espera execução "every 15 minutes" vai se decepcionar, e há cenários sem execução nenhuma ([iOS Background Execution Limits](https://developer.apple.com/forums/thread/685525), Quinn/DTS).
- `BGContinuedProcessingTask` (iOS 26+) começa em primeiro plano por ação do usuário e mostra progresso numa Live Activity ([doc](https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtask)). Não serve para um envio silencioso.

### 1.5 `URLSession` de background (iOS)

- "A session configured with this object hands control of the transfers over to the system, which handles the transfers in a separate process. In iOS, this configuration makes it possible for transfers to continue even when the app itself is suspended or terminated" ([`background(withIdentifier:)`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background(withidentifier:))).
- **Espera a rede sozinha:** `waitsForConnectivity` "is ignored by background sessions, which always wait for connectivity" ([doc](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/waitsforconnectivity)).
- **Usuário tira o app do seletor:** "If the user terminates the app from the multitasking screen, the system cancels all of the session's background transfers. In addition, the system does not automatically relaunch apps that were force quit by the user" (mesma página).
- **Restrições** ([Downloading files in the background](https://developer.apple.com/documentation/foundation/downloading-files-in-the-background)): o upload tem que ser de arquivo ("uploads from data instances or a stream fail after the app exits"), a sessão precisa de delegate e redirects são sempre seguidos.
- **Agendamento:** tarefas criadas com o app em segundo plano são tratadas como `isDiscretionary = true`, e o sistema escolhe o momento ([isDiscretionary](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/isdiscretionary)). Há também um *rate limiter* que atrasa cada nova tarefa criada em segundo plano, mais a cada relançamento, e que zera quando o usuário traz o app para a frente. Daí a regra: **criar a tarefa com o app em primeiro plano**, no "salvar".
- **Entrega do resultado:** se o app foi encerrado pelo sistema, o iOS o relança em segundo plano e chama `application(_:handleEventsForBackgroundURLSession:completionHandler:)`. O app recria a sessão com o mesmo identificador e recebe os eventos do delegate. O Expo encaminha esse callback para módulos via `ExpoAppDelegateSubscriber` ([`ExpoAppDelegateSubscriberManager.swift`](https://github.com/expo/expo/blob/sdk-57/packages/expo-modules-core/ios/AppDelegates/ExpoAppDelegateSubscriberManager.swift)). O delegate roda em Swift. O JS não precisa subir.
- **Ordem:** a sessão de background não promete ordem entre tarefas. Ver a questão em aberto 1.
- **Expo Go:** não, pela mesma razão do Android.

**`expo-file-system` já expõe isso no iOS**, sem Swift próprio. No SDK 57, o upload tem `sessionType: 'background'` como padrão no iOS. A própria doc avisa: "the JavaScript `UploadTask` instance is not restored if the app is terminated or relaunched, so its promise, progress callbacks, and cancellation state are only available while the original JS runtime is still alive" ([`NetworkTasks.types.ts`](https://github.com/expo/expo/blob/sdk-57/packages/expo-file-system/src/NetworkTasks.types.ts)). Ou seja, se o processo morrer, **o status HTTP se perde**. No Android, o mesmo upload é OkHttp dentro do processo ([`FileSystemUploadTask.kt`](https://github.com/expo/expo/blob/sdk-57/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemUploadTask.kt)), sem segundo plano. Isso só serve como atalho para o iOS se o backend devolver um 409 identificável no reenvio (TE-83, seção 10, item 5).

### Resumo

| Mecanismo | Quando roda | Limite de tempo | App tirado dos recentes | Expo Go |
|---|---|---|---|---|
| `expo-background-task` Android | ≥ 15 min depois de agendar (padrão de 24 h no código), com rede, nunca com o app na frente | 10 min | Continua (Android puro). Forçar parada cancela | Não na prática |
| `expo-background-task` iOS | Quando o iOS quiser, com o aparelho ocioso | Minutos, interrompível | Para até o usuário reabrir | Não |
| WorkManager nativo | Assim que houver rede (Doze e buckets à parte) | 10 min por execução | Continua. Forçar parada cancela até reabrir | Não |
| `BGAppRefreshTask` | Heurística do iOS | 30 s | Para até reabrir | Não |
| `URLSession` background | Assim que houver rede (tarefa criada em primeiro plano) | Sem limite no processo do app (outro processo) | Transferências canceladas, sem relançamento | Não |

## 2. JS headless ou nativo

- **O custo do JS headless** é subir o processo do app, o React Native/Hermes e avaliar o bundle inteiro: tudo o que o `index.ts` e o `_layout.tsx` importam, inclusive Drizzle, tRPC e better-auth. Isso acontece só para fazer um `fetch` (seção 1.1). O worker nativo sobe só o processo Android (`Application` e WorkManager), sem `ReactHost`. No iOS, a sessão de background nem precisa do processo do app para transferir. **Sem medição primária de memória e tempo.** Se for preciso um número, medir com `adb shell dumpsys meminfo <pacote>` durante um worker headless e um nativo. Mesmo sem número, o nativo é mais leve por construção, e no iOS é o único que transfere com o app suspenso.
- **Os ganhos que pesam mais que a leveza:**
  1. o Android roda **assim que a rede volta**, não depois de 15 min, e roda mesmo com o app na frente;
  2. o iOS envia **sem depender de `BGProcessingTask`**, que só roda com o aparelho ocioso;
  3. nenhum caminho lê o Keychain com o aparelho bloqueado (seção 5).
- **Custo de escrever o módulo (estimativa):** `npx create-expo-module@latest --local` gera `modules/<nome>/{android,ios,src,expo-module.config.json}`, ligado por autolinking ([Expo Modules: get started](https://docs.expo.dev/modules/get-started/)). Cada mudança nativa exige rebuild (`expo run:*` ou EAS).
  - Kotlin: `Module` com 4 ou 5 funções (`entregar`, `cancelar`, `definirCredencial`, `agendar`, `lerResultados`) mais um `CoroutineWorker` com `HttpURLConnection` ou OkHttp. Na ordem de 200 a 300 linhas, mais `androidx.work:work-runtime-ktx` no `build.gradle` do módulo.
  - Swift: `Module` com as mesmas funções, um `URLSessionDataDelegate` que grava o resultado e um `ExpoAppDelegateSubscriber` para `handleEventsForBackgroundURLSession`. Na ordem de 200 a 300 linhas.
  - Testes: o iOS não testa background no simulador. O Android força o worker com `adb shell cmd jobscheduler run -f <pacote> <id>`. São números de ordem de grandeza, não medidos.
- **Bibliotecas prontas:** nenhuma serve.
  - [`react-native-background-upload`](https://github.com/Vydia/react-native-background-upload) (Android Upload Service + `URLSession` de background) é o mais próximo, mas a última publicação é a `6.6.0`, de out/2022 (`npm view`), sem menção à nova arquitetura.
  - [`@kesha-antonov/react-native-background-downloader`](https://github.com/kesha-antonov/react-native-background-downloader) é mantido, mas só faz download.
  - [`react-native-background-fetch`](https://github.com/transistorsoft/react-native-background-fetch) é JS headless, com os mesmos limites da seção 1.1.

## 3. Entrega ao processo sem SQLite

**Tamanho do payload.** O exemplo de `docs/planos/exemplo-frontend-envio-avaliacao.md` usa `unidades[]` (não `agrupamentos[]`, como diz o ticket), cada uma com `agrupamentoId`, `ordem`, `nome` e `respostas[]`. Medido em JSON compacto UTF-8 com o envelope `{"json": …}` do superjson:

| Caso | Bytes |
|---|---|
| Exemplo do doc (2 gerais, 1 agrupamento × 2, 3 campos) | ~0,6 KB |
| Médio (5 gerais com 1 observação de 300 caracteres, 2 agrupamentos × 3, 6 campos) | ~2,8 KB |
| Grande (10 gerais com 3 observações de 2000 caracteres, 4 agrupamentos × 5, 10 campos) | ~17,8 KB |

O que domina são as observações de texto. Os casos médio e grande são estimativas.

| Opção | Veredito |
|---|---|
| `Data` de entrada do WorkManager | **Não.** O limite é rígido: `MAX_DATA_BYTES = 10 * 1024`, e acima dele `toByteArray` lança `IllegalStateException` ([`Data_.kt`](https://github.com/androidx/androidx/blob/androidx-main/work/work-runtime/src/main/java/androidx/work/Data_.kt)). O caso grande estoura, e o próprio código diz que `Data` "should not be considered your data store". Serve só para passar um id. |
| SharedPreferences / UserDefaults | Só para metadados pequenos (flag de sessão expirada, por exemplo). São carregados inteiros na memória e não são fila. |
| **Um arquivo por item** no armazenamento do app | **Sim.** O upload do iOS **exige** arquivo (seção 1.5), então o Android usa o mesmo formato. |

Formato proposto, em `Paths.document/fila-envio/` (`expo-file-system`; no nativo, `filesDir` e `Documents`):

- `pendentes/<seq>-<avaliacaoId>.json`: metadados `{ id, avaliadorId, url, metodo, headers, criadoEm }` (sem o cookie no Android; seção 5).
- `pendentes/<seq>-<avaliacaoId>.body`: o corpo exato a enviar, ou seja, a saída de `JSON.stringify(superjson.serialize(input))`. É o que o `httpLink` do tRPC manda para `POST <Next>/api/trpc/<procedure>` em mutation sem batch ([`httpUtils.ts`](https://github.com/trpc/trpc/blob/main/packages/client/src/links/internals/httpUtils.ts)). O nativo não sabe nada de tRPC nem de superjson.
- **Escrita atômica:** gravar `.tmp` e renomear. O `.json` é o ponto de commit e é gravado por último.
- `<seq>` com zeros à esquerda dá a ordem FIFO por nome de arquivo.
- **Proteção de dados no iOS:** o padrão dos arquivos é "Complete until first user authentication", acessível em segundo plano depois do primeiro desbloqueio ([Encrypting your app's files](https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files)). Não usar `.complete` nesses arquivos. No Android, `filesDir` fica no armazenamento cifrado por credencial e também só abre depois do primeiro desbloqueio. O WorkManager não roda antes disso sem *direct boot*, o que é aceitável.

O SQLite continua sendo a fonte da verdade. O arquivo é uma cópia de entrega, recriável a qualquer momento a partir da tabela `fila_envio`.

## 4. Resultado de volta ao app

- **Arquivo de resultado por item:** `resultados/<avaliacaoId>.json` com `{ id, estado: "enviada" | "recusada" | "falhou" | "nao_autenticado", httpStatus, corpo (truncado em ~4 KB), tentativas, em }`.
- **Ordem no remetente:** gravar o resultado, e só depois apagar `pendentes/<…>`. Se o processo morrer no meio, o app encontra os dois e aplica o resultado (a reconciliação é idempotente).
- **Classificação no remetente** (mínima, para decidir se continua):
  - 2xx → `enviada`;
  - 401 → `nao_autenticado` e **para o dreno**;
  - transporte, timeout, 5xx ou 429 → no Android, `Result.retry()` (backoff), mantendo o item na cabeça; no iOS, `falhou`, porque a tarefa termina e o app recria na abertura;
  - outro 4xx → `recusada`, e segue para o próximo item.
- A interpretação fina (`upstreamStatus`, categoria encerrada, versão do modelo) fica no JS, que lê `corpo` na reconciliação. Isso depende da correção do `errorFormatter` proposta no TE-83 (seção 5), porque hoje o tRPC devolve 500 para 4xx desconhecidos. Sem ela, o remetente nativo classificaria esses casos como temporários.
- **Na abertura** (e no `AppState` → `active`): o JS lê `resultados/`, aplica tudo ao SQLite numa transação, apaga os arquivos aplicados, recria em `pendentes/` o que estiver na fila do SQLite sem arquivo e chama `agendar()`. Esse é o "sync ao abrir". Com o app vivo, o módulo também pode emitir um evento Expo (`sendEvent`) por resultado, como atalho opcional.
- **Um só remetente.** O módulo nativo é o único que envia, inclusive com o app em primeiro plano: o "sync ao abrir" só enfileira o trabalho nativo. Assim não há corrida entre o JS e o worker mandando a mesma avaliação. Se o JS também precisar enviar, a posse do item tem que ser atômica (por exemplo, `rename` de `pendentes/` para `enviando/`).
- **A porta do TE-83 muda de forma.** `enviar(avaliacao): Promise<Resultado>` vira `entregar(item)` mais `lerResultados(): Resultado[]`. A classificação `ok | temporario | nao_autenticado | recusado` continua a mesma.

## 5. Autenticação

**Onde está o cookie hoje.** O `expoClient` guarda o cookie jar em `SecureStore` sob a chave `te-inscreve_cookie`, como JSON `{ nome: { value, expires } }`, dividido em pedaços acima de 1800 caracteres ([`client.ts`](https://github.com/better-auth/better-auth/blob/main/packages/expo/src/client.ts), `storageAdapter`). Ele chama `storage.setItem(chave, valor)` **sem opções** (`apps/mobile/src/utils/auth.ts` passa o `SecureStore` cru).

**iOS Keychain.**
- No `expo-secure-store` do SDK 57, `keychainAccessible` tem padrão `.whenUnlocked` ([`SecureStoreModule.swift`](https://github.com/expo/expo/blob/sdk-57/packages/expo-secure-store/ios/SecureStoreModule.swift); `@default SecureStore.WHEN_UNLOCKED` no `.d.ts`).
- `kSecAttrAccessibleWhenUnlocked`: "can be accessed only while the device is unlocked". `kSecAttrAccessibleAfterFirstUnlock` é o "recommended for items that need to be accessed by background applications" ([WhenUnlocked](https://developer.apple.com/documentation/security/ksecattraccessiblewhenunlocked), [AfterFirstUnlock](https://developer.apple.com/documentation/security/ksecattraccessibleafterfirstunlock)).
- **Consequência:** uma tarefa JS headless no iOS, que roda em `BGProcessingTask` com o aparelho ocioso e quase sempre bloqueado, **não consegue ler o cookie hoje**.
- Na recomendação isso não importa, porque o cookie é posto no header da `URLRequest` quando a tarefa é criada, com o app em primeiro plano. Usar `httpShouldSetCookies = false` na sessão, para o `HTTPCookieStorage` não misturar cookies.
- Se o plano B for adotado, a correção é embrulhar o storage do `expoClient` passando `keychainAccessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. Atenção: o `set` do módulo, quando o item já existe, cai em `SecItemUpdate` só do valor e **não muda a acessibilidade**. É preciso `deleteItemAsync` antes, numa migração.

**Android Keystore.**
- O `SecureStore` cifra com uma chave AES do Keystore criada com `setUserAuthenticationRequired(options.requireAuthentication)`, falso por padrão, e sem `setUnlockedDeviceRequired` ([`AESEncryptor.kt`](https://github.com/expo/expo/blob/sdk-57/packages/expo-secure-store/android/src/main/java/expo/modules/securestore/encryptors/AESEncryptor.kt)). Logo, ele **é legível com a tela bloqueada** depois do primeiro desbloqueio.
- Mesmo assim, o worker Kotlin não deve ler o SecureStore: isso o acoplaria ao formato interno do Expo (alias, prefs, IV) e ao formato de pedaços do better-auth.
- Em vez disso, o app chama `definirCredencial(authClient.getCookie())` a cada abertura e depois de cada login. O módulo grava o valor no armazenamento privado do app. Opcionalmente, ele o cifra com uma chave própria do Keystore, sem exigir desbloqueio.

**Validade do cookie no caminho de segundo plano.**
- O cookie é JWE com `maxAge` de 7 dias e `refreshCache: true` (`packages/auth/src/index.ts`). O JWT do Django vai dentro dele e é renovado pelo `get-session` do Next a partir do `rest_refresh` (TE-83, seção 4).
- Como o remetente nativo reenvia o cookie jar inteiro, o Next consegue renovar o JWT do lado do servidor enquanto o refresh do Django for válido. Porém, o cookie renovado na resposta **não volta ao aparelho**: é o mesmo achado do TE-83, agora também no nativo.
- Mitigação: na abertura, chamar `authClient.getSession({ query: { disableCookieCache: true } })` antes de `definirCredencial` e antes de recriar as tarefas do iOS (as que já estão criadas levam o cookie da época da criação).

**401 sem UI.**
- O remetente grava `nao_autenticado` no item, cria `fila-envio/sessao-expirada` e **para**. No Android, isso é `Result.success()`, para o WorkManager não insistir com backoff; no iOS, as tarefas restantes chegam com 401 e são registradas do mesmo jeito.
- Nada é apagado. Na abertura, o app vê a flag, aplica "pausa a fila inteira e pede novo login" (spec) e, depois do login, chama `definirCredencial`, recria os pendentes e agenda.
- Notificação local avisando que precisa entrar de novo é possível, mas fica fora do v1 (a spec não tem toast nem notificação).

**Django direto ficou mais atraente?** **Não.**
- Com o cookie, o remetente nativo trata a credencial como um header opaco, e a renovação do JWT continua no Next.
- Ir direto obrigaria a reimplementar o refresh do JWT (mutex, rotação, SecureStore) **duas vezes, em Kotlin e em Swift**, além de tirar o `X-API-KEY` do bundle (TE-83, seção 4). No iOS seria ainda pior: o `URLSession` de background congela os headers na criação da tarefa, então um JWT de minutos (padrão do simplejwt: 5 min, se for o caso) expiraria na fila. O cookie do Next sobrevive porque o Next renova o JWT do lado do servidor.
- A decisão do TE-83 se mantém, e a porta continua permitindo trocar o transporte depois.

## 6. Limites que a política de sync precisa respeitar

1. **O segundo plano nunca é garantido.** Forçar parada (Android) e tirar do seletor (iOS) cancelam tudo até a próxima abertura. Fabricantes podem restringir mais. O sync ao abrir é obrigatório (já decidido).
2. **Android, janela de execução:** até 10 min por worker. O dreno verifica `isStopped` entre itens e usa timeout por requisição (por exemplo, 30 s). O que sobrar fica para a próxima execução.
3. **Android, retentativa:** backoff exponencial de no mínimo 10 s e no máximo 5 h. Doze e os buckets rare/restricted adiam o envio, ou cortam a rede, por horas.
4. **Android, `Data` ≤ 10 KB:** só ids ou nada. O payload vai em arquivo.
5. **iOS, a tarefa nasce em primeiro plano:** criar o upload no "salvar". Tarefas criadas em segundo plano ficam discricionárias e sujeitas a atraso crescente.
6. **iOS, só upload de arquivo:** o corpo tem que estar em disco antes de criar a tarefa.
7. **iOS, sem ordem garantida** entre tarefas da mesma sessão. Ver a questão em aberto 1.
8. **iOS, headers congelados:** o cookie que vale é o do momento da criação. Recriar as tarefas pendentes quando a sessão for renovada.
9. **Resposta perdida → reenvio → recusa.** Força-quit no meio do envio ou processo morto antes de gravar o resultado causam reenvio. Sem um 409 identificável do backend (TE-83, seção 10, item 5), a avaliação iria para "com erro" por engano.
10. **Edição de item na fila:** a spec diz que um item "na fila é editável até o envio começar". Com a entrega ao nativo, o envio pode começar a qualquer momento, sem o app saber. Ver a questão em aberto 2.
11. **Logout ou troca de avaliador:** cancelar o trabalho nativo (`cancelUniqueWork` / `invalidateAndCancel` da sessão) e apagar `pendentes/` e a credencial. Só os itens do avaliador logado são entregues (spec: "só a fila dele é enviada").
12. **Classificação de status no nativo depende do TE-83:** sem `upstreamStatus` no `errorFormatter`, um 4xx desconhecido chega como 500 e seria retentado para sempre.
13. **Teste:** BGTask e sessão de background não funcionam no simulador iOS. Testar em aparelho físico e, no Android, forçar o job via `adb`.

## Questões em aberto para o desenvolvedor

1. **FIFO estrita é necessária?** As avaliações são independentes (uma por inscrição), e a spec usa FIFO para não travar e para ter previsibilidade. O Android preserva a ordem (dreno sequencial). O iOS não, a menos que se crie uma tarefa por vez, encadeada no delegate, o que esbarra no *rate limiter* de tarefas criadas em segundo plano. Proposta: aceitar que a ordem é "melhor esforço" no iOS.
2. **Quando o "envio começou"?** Opção a: no momento da entrega ao nativo. Nesse caso, editar exige `cancelar(id)`, que pode chegar tarde no iOS e gerar 409. Opção b: só quando o resultado volta, e aí a edição cancela e recria, aceitando o risco de duplicata. A opção a é mais simples e honesta. Ela muda o texto da spec ("editável até entrar na fila de envio").
3. **Plano B como etapa intermediária?** Lançar primeiro só o sync ao abrir mais o `expo-background-task` (sem nativo) e adicionar o módulo depois? Isso reduz o risco inicial, mas exige a migração do Keychain para `AFTER_FIRST_UNLOCK` (seção 5) e entrega pouco no iOS.

## Lacunas e o que verificar em aparelho

- Custo real de memória e tempo do worker headless contra o nativo (sem medição primária).
- Se o worker com `CONNECTED` roda logo ao voltar a rede em aparelhos Samsung com One UI recente, durante um evento.
- Se o iOS honra a flag de force-quit em todos os casos (o DTS diz que "In some circumstances iOS will not honour this flag", sem documentar quais).
- A divergência entre doc e código do `expo-background-task` no intervalo padrão do Android (12 h × 24 h), se o plano B for usado.

## Fontes

- Expo SDK 57: [BackgroundTask](https://docs.expo.dev/versions/v57.0.0/sdk/background-task/), [TaskManager](https://docs.expo.dev/versions/v57.0.0/sdk/task-manager/), [Expo Modules: get started](https://docs.expo.dev/modules/get-started/) e o código no branch [`sdk-57`](https://github.com/expo/expo/tree/sdk-57), além dos pacotes do npm com dist-tag `sdk-57`, todos linkados acima.
- Android: [Define work](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work), [Persistent work](https://developer.android.com/develop/background-work/background-tasks/persistent), [Doze e App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby), [Power management restrictions](https://developer.android.com/topic/performance/power/power-details), [Android 15](https://developer.android.com/about/versions/15/behavior-changes-all) e o código do AndroidX (`ListenableWorker.java`, `WorkRequest.kt`, `Data_.kt`, `ForceStopRunnable.java`).
- Apple: [BGProcessingTask](https://developer.apple.com/documentation/backgroundtasks/bgprocessingtask), [BGAppRefreshTask](https://developer.apple.com/documentation/backgroundtasks/bgapprefreshtask), [Choosing background strategies](https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app), [Using background tasks to update your app](https://developer.apple.com/documentation/uikit/using-background-tasks-to-update-your-app), [Downloading files in the background](https://developer.apple.com/documentation/foundation/downloading-files-in-the-background), [`background(withIdentifier:)`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background(withidentifier:)), [isDiscretionary](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/isdiscretionary), [waitsForConnectivity](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/waitsforconnectivity), [Encrypting your app's files](https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files), as constantes de acessibilidade do Keychain e [iOS Background Execution Limits](https://developer.apple.com/forums/thread/685525) (DTS).
- better-auth: [`packages/expo/src/client.ts`](https://github.com/better-auth/better-auth/blob/main/packages/expo/src/client.ts) (lido no pacote `@better-auth/expo@1.6.25`) e [session management](https://www.better-auth.com/docs/concepts/session-management).
- tRPC: [`httpUtils.ts`](https://github.com/trpc/trpc/blob/main/packages/client/src/links/internals/httpUtils.ts).
- Comunidade (não primária): [dontkillmyapp.com/samsung](https://dontkillmyapp.com/samsung).
- Repo: arquivos listados no início.
