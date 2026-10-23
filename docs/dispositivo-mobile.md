# Dispositivo físico no app mobile

Como o app em `apps/mobile` roda num aparelho Android de verdade (Expo Go) e
alcança o Metro e o BFF Next.js da máquina de desenvolvimento.

## A rede vai pelo Wi-Fi; o cabo é só do agente

O aparelho fala com a máquina **pela rede local**. O Metro sobe em modo LAN
(`--lan`, configuração `mobile` em `.claude/launch.json`) e anuncia o IP de rede
da máquina. `src/utils/base-url.ts` monta a URL do BFF a partir desse mesmo host
(`http://<IP da máquina>:3000`), então app, bundle e API seguem o mesmo caminho.

O cabo USB e o `adb` servem **apenas para o agente testar**: abrir rotas, tirar
capturas, tocar na tela, ler logs. Nada no funcionamento do app depende dele.

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

1. `preview_start` com a configuração `mobile` (Metro na porta 8082). O BFF
   precisa estar de pé na 3000 (configuração `web`).
2. Abra pela URL que o Metro imprime, `exp://<IP da máquina>:8082`, pelo QR code
   ou, via `adb`:

   ```bash
   adb shell am start -a android.intent.action.VIEW -d 'exp://<IP da máquina>:8082/--/<rota>' host.exp.exponent
   ```

O IP vem por DHCP e pode mudar; o Metro pega o novo ao reiniciar. Leia-o da saída
do Metro, não o fixe em código.

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
