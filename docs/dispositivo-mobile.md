# Dispositivo físico no app mobile

Como o app em `apps/mobile` roda num aparelho Android de verdade, como build de
desenvolvimento (`expo-dev-client`), e alcança o Metro e o BFF Next.js da
máquina de desenvolvimento.

## Build de desenvolvimento, não Expo Go

O app roda no aparelho como ele mesmo (`br.com.teinscreve.app`), com as
ferramentas de desenvolvimento embutidas. O JavaScript continua vindo do Metro
pela rede, com Fast Refresh; só o código nativo fica no APK.

O Expo Go foi abandonado de propósito. Desde o SDK 58, a `formSheet` não aparece
nele: a folha monta, mas não recebe as insets da janela e nunca começa a entrar,
e esconder e mostrar a status bar, que antes a destravava, não adianta mais. No
build de desenvolvimento a activity é do app e a folha funciona. Além disso, o
que vem pela frente — tarefa em segundo plano, módulo nativo próprio — não roda
no Expo Go.

Refaça o build só quando o lado nativo mudar: dependência com código nativo,
plugin ou campo de `app.config.ts`. Mudança de JavaScript chega pelo Metro.

### Gerar e compilar

A pasta `apps/mobile/android` é gerada (`expo prebuild`) e está no `.gitignore`;
nada nela é editado à mão. O build pede JDK 17 e o Android SDK com as versões
que o React Native fixa em `node_modules/react-native/gradle/libs.versions.toml`
(SDK, build-tools e NDK). `JAVA_HOME` e `ANDROID_HOME` apontam para eles.

```bash
cd apps/mobile && npx expo prebuild --platform android --no-install
```

```bash
cd apps/mobile/android && ./gradlew app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=3
```

`reactNativeArchitectures` compila o C++ só para a arquitetura do aparelho
(`adb shell getprop ro.product.cpu.abi`), e `--max-workers` segura a memória: o
build compila bastante C++ e, com pouca RAM livre, trava a máquina ou falha. O
primeiro leva alguns minutos; os seguintes reaproveitam o cache do Gradle.

```bash
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

O build de debug já libera HTTP sem TLS (`usesCleartextTraffic`), que o Metro e
o BFF locais usam.

## A rede vai pelo Wi-Fi; o cabo é só do agente

O aparelho fala com a máquina **pela rede local**. O Metro sobe em modo LAN
(`--lan`, configuração `mobile` em `.claude/launch.json`) e anuncia o IP de rede
da máquina. `src/utils/base-url.ts` monta a URL do BFF a partir desse mesmo host
(`http://<IP da máquina>:3000`), então app, bundle e API seguem o mesmo caminho.

O cabo USB e o `adb` servem **apenas para o agente testar**: instalar o APK,
abrir o app, tirar capturas, tocar na tela, ler logs. Nada no funcionamento do
app depende dele.

### Por que não `--localhost` com `adb reverse`

Essa foi a configuração anterior, e foi trocada de propósito. O `adb reverse`
vive dentro da conexão USB atual: ele some quando o cabo é desconectado, quando a
conexão cai e volta, quando o servidor `adb` reinicia ou quando o aparelho
reinicia. Com `--localhost`, o app aponta para `127.0.0.1` no aparelho e, sem o
redirecionamento, perde o Metro e a API a cada reconexão do cabo.

Se o modo LAN parar de funcionar, diagnostique a rede (abaixo) e mantenha o
`--lan`. Um `adb reverse` pontual para destravar um teste é aceitável, desde que
`.claude/launch.json` continue em `--lan`.

## Abrir o app no aparelho

1. Suba o que o app usa: o Metro (`preview_start` com a configuração `mobile`,
   porta 8082), o BFF (configuração `web`, porta 3000) e a API REST do repositório
   `api` na 8002, ouvindo em `0.0.0.0` para servir também as fotos ao aparelho. O
   login passa pelo BFF até a API: com ela fora do ar, a tela mostra "Não foi
   possível entrar", não "Sem conexão".
2. Abra o app no Metro pelo esquema do build de desenvolvimento:

    ```bash
    adb shell am start -a android.intent.action.VIEW -d 'exp+te-inscreve://expo-development-client/?url=http%3A%2F%2F<IP da máquina>%3A8082' br.com.teinscreve.app
    ```

    Na primeira abertura, o menu de desenvolvimento mostra um cartão de boas-vindas
    por cima do app; feche em "Continue".

O IP vem por DHCP e pode mudar; o Metro pega o novo ao reiniciar. Leia-o da saída
do Metro, não o fixe em código.

Se o app ficar em "Reloading…" porque o Metro caiu no meio, ele não aceita mais o
link: pare-o (`adb shell am force-stop br.com.teinscreve.app`) e abra de novo.
Parar o app desfaz a sessão, então quem estiver logado entra outra vez.

## Quando o aparelho não alcança a máquina

Teste do próprio aparelho, que tem `curl`:

```bash
adb shell curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 http://<IP da máquina>:3000/
adb shell curl -s --max-time 8 -H 'expo-platform: android' http://<IP da máquina>:8082/ | head -c 200
```

`200` na 3000 e um manifesto JSON na 8082 significam rede ok; o problema está no
app. Se falhar:

- **Redes diferentes sem rota.** Máquina no cabo e aparelho no Wi-Fi podem ficar
  em sub-redes diferentes; funciona quando a rede roteia entre elas. Confira com
  `adb shell ping -c 3 <IP da máquina>`.
- **Firewall da máquina** bloqueando 3000 ou 8082 de fora (`ufw status`).
- **Rede com isolamento de clientes** (comum em Wi-Fi de visitantes): os
  aparelhos não se enxergam. Troque de rede.
