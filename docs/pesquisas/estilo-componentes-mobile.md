# Estilo e biblioteca de componentes do app mobile

Pesquisa do ticket [TE-75](https://linear.app/te-inscreve/issue/TE-75). Fontes consultadas em 21/10/2026. Estado de partida: `apps/mobile` na branch `feat/mobile` (commit `7441a33`), com Expo `~57.0.30`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3`, `nativewind@5.0.0-rc.0` e `react-native-css@3.1.0-rc.0`. O app ainda não tem componentes: só `src/app/index.tsx` e `_layout.tsx`.

## Recomendação

**Uniwind (Tailwind 4) + React Native Reusables, variante `uniwind` do registry**, completado por `sonner-native` (toast), `@gorhom/bottom-sheet` ou a apresentação `formSheet` do expo-router (sheet) e `FlatList`/FlashList (lista).

- **O tema compartilhado sobrevive.** O app continua importando o mesmo `theme.css` do web. A única linha nova é redeclarar o variant `dark` do Uniwind depois do import, porque o `theme.css` redefine `dark` como classe `.dark`. Compilei o `theme.css` real com o pipeline nativo do Uniwind 1.13.0 e os tokens claros e escuros saem convertidos para hex (detalhes na seção 2).
- **É estável e já está pronto para o SDK 58.** O Uniwind está na `1.13.0`, com release a cada 2–4 semanas. O conserto para o RN 0.88 (`AssetRegistry`) saiu em 19/10/2026. O NativeWind 5 ainda é release candidate, e a própria documentação diz que ele "is not intended for production use". O `react-native-css` ainda tem esse mesmo bug do RN 0.88 em aberto ([#504](https://github.com/nativewind/react-native-css/pull/504), [#506](https://github.com/nativewind/react-native-css/issues/506)).
- **O vocabulário é o do shadcn.** O React Native Reusables (RNR) segue o estilo shadcn **new-york**: `Button`, `Dialog`, `Select`, `Tabs`, `Label`, `Input`, `Skeleton`, com `cva` e `cn`. Os nomes de token são os mesmos do `packages/components` (`primary`, `muted`, `destructive`…). A variante `uniwind` do registry é oficial, e o CLI a detecta pelo `uniwind-types.d.ts`.
- **A troca custa pouco hoje.** Ela mexe em `metro.config.js`, `styles.css`, no arquivo de tipos e em duas dependências. O preço só cresce depois que as telas existirem.

O que se perde: no Uniwind gratuito, as variantes `group-*` não têm efeito em runtime. Elas só funcionam no Pro, que é pago. No RNR, isso afeta o texto que muda de cor quando o pai é pressionado (`group-active:text-accent-foreground`) em `Button` ghost/outline, `Select`, `DropdownMenu`, `ContextMenu` e `Menubar`. O fundo pressionado (`active:`) continua funcionando. O ajuste é local: trocar por `active:` no próprio texto, ou aceitar.

**Segunda opção, se o NativeWind 5 sair estável (com o conserto do RN 0.88) antes da primeira release do app:** ficar no NativeWind 5 + RNR variante `nativewind`. Nesse caso, só um arquivo do registry precisa mudar (seção 1).

## 1. NativeWind 5 + RNR variante `nativewind`

### Maturidade

| Fato | Fonte |
|---|---|
| `nativewind`: `latest` = `4.2.7`. O v5 está em `rc` = `5.0.0-rc.0` (13/09/2026), depois de cinco previews entre set/2025 e mai/2026. | `npm view nativewind dist-tags time` |
| "a pre-release version of Nativewind. It is not intended for production use." | [nativewind.dev/v5](https://www.nativewind.dev/v5) |
| O `react-native-css@3.1.0-rc.0` é o "release candidate for Expo SDK 57", feito para Expo 57.0.22, RN 0.86.3, React 19.2.3 e Reanimated 4.5.1. O `latest` continua em `3.0.7` (abr/2026). | [release 3.1.0-rc.0](https://github.com/nativewind/react-native-css/releases) |
| Mantenedor: Mark Lawlor (217 commits no `react-native-css`, contra 64 do segundo colocado, que é o dependabot). O repo tem 132 issues e PRs abertos. O `nativewind` tem 8,1 mil estrelas e 62 abertos. | GitHub API: `repos/nativewind/react-native-css`, `/contributors` |
| **RN 0.88:** o shim de `react-native` do `react-native-css` não reexporta `AssetRegistry`, e o `expo-asset` 58 falha ("every asset load fails", com fontes caindo para a fonte do sistema). O PR está aberto. | [#504](https://github.com/nativewind/react-native-css/pull/504), [#506](https://github.com/nativewind/react-native-css/issues/506) |

### O tema compartilhado

**Sobrevive sem mudança.** Isso já foi verificado em `docs/pesquisas/nativewind-tema.md`, e é o estado atual do app. Um cuidado novo no rc.0: o compilador agora **lança erro** para seletores `:root` qualificados por classe ("Class-qualified :root selectors are unsupported on native", em `src/compiler/compiler.ts` do `react-native-css@3.1.0-rc.0`). Antes ele descartava esses seletores em silêncio. Por isso, o `@custom-variant dark (@media (prefers-color-scheme: dark))` em `apps/mobile/src/styles.css` deixou de ser opcional.

### Quanto do registry `nativewind` (escrito para o v4) funciona no v5

Verifiquei na prática. Gerei o CSS do Tailwind 4.3.3 a partir do `styles.css` real do mobile, apontando o `@source` para os 32 arquivos de `packages/registry/src/nativewind` do RNR (`main`, set/2026). Depois compilei esse CSS com o `react-native-css@3.1.0-rc.0` instalado, com `inlineRem: 16`.

- **Quebra: 1 arquivo.** O `icon.tsx` importa `cssInterop` de `nativewind`. O v5 não exporta mais essa função: o `src/index.tsx` do pacote só reexporta `styled`, `useCssElement`, `vars` e `VariableContextProvider`. A documentação confirma: "Nativewind RC0 does not export the v4 `cssInterop` or `remapProps` functions" ([nativewind.dev/v5](https://www.nativewind.dev/v5)). A troca é mecânica: `styled(IconImpl, { className: { target: 'style', nativeStyleMapping: { height: 'size', width: 'size' } } })`. O `nativeStyleToProp` ainda existe, mas como `@deprecated` (`src/runtime.types.ts`).
- **Compila e chega ao nativo:** tokens do tema (`bg-primary` → `var(primary)`), `active:`, `dark:` (vira `prefers-color-scheme`), `aria-invalid:` (condição de atributo), `group-active:` (container query `g:group`), `placeholder:` (`placeholderTextColor`), `animate-pulse` (Skeleton), `rounded-*` com `calc(var(--radius) - Npx)` e opacidade `/90` (`colorMix` em runtime).
- **Some no nativo** (55 de 428 classes geradas): quase todas são só do web e também já sumiam no v4. Exemplos: `focus-visible:*`, `cursor-*`, `has-[>svg]:*`, `[&_svg]:*`, `origin-(--radix-…)`, `whitespace-nowrap`, `overflow-y-auto`. As que fazem alguma diferença no nativo:
  - `max-w-[calc(100%-2rem)]` em `dialog.tsx` e `alert-dialog.tsx`: o Yoga não mistura `%` com `rem` em `calc()`. A variante `uniwind` já move essa classe para `web:`.
  - `h-[calc(100%-1px)]` no `TabsTrigger`, `last:border-b-0` no `Accordion` e `peer-disabled:opacity-50` no `Label`.
  - `w-[--radix-select-trigger-width]` no `SelectContent`. O conteúdo do select não acompanha a largura do gatilho.
- **O CLI do RNR não serve para esse caminho.** Para a variante `nativewind`, ele exige `tailwind.config.js` e instala `tailwindcss@^3.4.14` (`apps/cli/src/project-manifest.ts`). Para adicionar componentes no v5, use `npx shadcn@latest add https://reactnativereusables.com/r/nativewind/<nome>.json` ou copie os arquivos.
- Um relato comunitário de migração completa do RNR para o v5 chegou às mesmas mudanças (`icon.tsx` com `styled`, largura do `SelectContent`) e acrescenta clipping de descendentes no `Input` do Android ([RNR #548](https://github.com/founded-labs/react-native-reusables/issues/548), aberta, sem resposta dos mantenedores). **Não verificado** em aparelho.

**Resumo:** cerca de 1 arquivo obrigatório e 3–4 ajustes cosméticos. O registry funciona no v5 quase sem mudança.

## 2. Uniwind + RNR variante `uniwind` (recomendada)

### Maturidade

| Fato | Fonte |
|---|---|
| `1.0.0` em 04/11/2025, `latest` = `1.13.0` (19/10/2026). Dez releases estáveis desde maio/2026. | `npm view uniwind time` |
| Mantenedores: Brentlok (359 commits) e jpudysz (75, autor do Unistyles), na org `uni-stack`. São 1,7 mil estrelas e **7** issues abertas. | GitHub API: `repos/uni-stack/uniwind` |
| 638 mil downloads/semana (nativewind: 1,2 milhão, a maior parte no v4). | npm downloads API, 12–18/10/2026 |
| Modelo de negócio: a versão gratuita é MIT ("production-ready and ships real apps today"). O Pro tem licença comercial (motor C++, `group-*`, transições de tema). | [Pro version](https://docs.uniwind.dev/pro-version) |
| Peers: `react >=19`, `react-native >=0.81`, `tailwindcss >=4`. Depende de `@tailwindcss/node@4.3.3` e `lightningcss@1.30.1`, as mesmas versões do monorepo. | `npm view uniwind peerDependencies dependencies` |
| **RN 0.88:** o 1.13.0 traz "fix: forward all React Native exports from native components entry" (#740), que fecha o bug do `AssetRegistry` com `expo-asset` 58 ([#732](https://github.com/uni-stack/uniwind/issues/732), [#737](https://github.com/uni-stack/uniwind/issues/737)). | [release v1.13.0](https://github.com/uni-stack/uniwind/releases/tag/v1.13.0) |

### O tema compartilhado: sobrevive com uma redeclaração

O Uniwind só reconhece tokens de tema escuro quando o seletor final é `:root:where(.dark, .dark *)`. É o que gera o variant `dark` dele (`uniwind.css`: `&:where(.dark, .dark *)` mais `@media (prefers-color-scheme: dark)`). O `theme.css` redefine `dark` como `&:is(.dark *)`, e o `RuleVisitor` do Uniwind ignora isso.

Testei três entradas no pipeline nativo do Uniwind 1.13.0, com o `transformer.cjs` publicado e o `theme.css` real:

| Entrada | Resultado |
|---|---|
| `@import "tailwindcss"; @import "uniwind"; @import "<theme.css>";` | Só os tokens claros (`--primary` → `#4b8b3b`). **O escuro se perde em silêncio.** |
| Igual, com `@import "<theme.css>" layer(theme);` | Erro do Tailwind: "`@custom-variant` cannot be nested" (o `theme.css` declara um `@custom-variant`). |
| Igual à primeira, mais o bloco `@custom-variant dark { … }` do `uniwind.css` **depois** do import | Correto: `scopedVars."__uniwind-theme-dark"` com `--primary` → `#74a669` e `--background` → `#141116`. Os valores claros ficam como padrão. |

Ou seja, o `apps/mobile/src/styles.css` fica:

```css
@import "tailwindcss";
@import "uniwind";
@import "@te-inscreve/tailwind-config/theme";

/* O theme.css define `dark` como a classe `.dark` do web; devolve o variant do Uniwind. */
@custom-variant dark {
    &:where(.dark, .dark *) { @slot; }
    @media (prefers-color-scheme: dark) {
        &:not(:where(.light, .light *, .dark, .dark *)) { @slot; }
    }
}
```

- `oklch` é convertido para hex no build (resultado acima). A documentação também cita OKLCH ([Global CSS](https://docs.uniwind.dev/theming/global-css)).
- `bg-primary/90` gera uma função de runtime sobre `vars["--primary"]`, e `rounded-md` vira `vars["--radius"] - 2` (saída compilada).
- O `rem` padrão é 16, igual ao web (`processor.ts`: `polyfills?.rem ?? 16`). A decisão sobre `inlineRem` que a pesquisa anterior deixou em aberto desaparece.
- A documentação pede que todos os temas definam as mesmas variáveis e avisa em `__DEV__` quando falta alguma. O formato do `theme.css` (claro em `:root`, escuro em variant) é diferente do formato documentado (`@variant light` e `@variant dark`). **Não verifiquei em aparelho** se isso gera um aviso ou se a troca de tema pelo sistema funciona em runtime. É o primeiro teste a fazer.

### Modo escuro

O tema `system` "automatically follows the device's color scheme" ([Theming basics](https://docs.uniwind.dev/theming/basics)). Há troca manual pelo `Uniwind.setTheme`.

### RNR na variante `uniwind`

A variante tem os mesmos 32 componentes da `nativewind`, e as diferenças são pontuais (`diff -r` dos dois diretórios). O `icon.tsx` usa `withUniwind` em vez de `cssInterop`. O `max-w-[calc(…)]` fica só em `web:`. O `Input` aceita `placeholderClassName`. O `Skeleton` anima com Reanimated em vez de `animate-pulse`. As variantes `group-active:`/`group-hover:` continuam no código (25 ocorrências) e **não geram estilo** no Uniwind gratuito: compilei a variante e `group-active:text-accent-foreground` não aparece na saída. A documentação confirma: "Free Version: Not supported. `group-*` classes are parsed but have no runtime effect" ([Supported classNames](https://docs.uniwind.dev/class-names)).

### Custo de adoção a partir do app atual

1. `metro.config.js`: `withNativewind(config)` → `withUniwindConfig(config, { cssEntryFile: "./src/styles.css" })`.
2. Trocar as dependências `nativewind` e `react-native-css` por `uniwind`. Remover `postcss.config.mjs` do mobile, porque o Uniwind compila o Tailwind por conta própria (`compileTailwind.ts` usa `@tailwindcss/node`).
3. Trocar `nativewind-env.d.ts` por `uniwind-types.d.ts`, que é gerado e também serve para o CLI do RNR detectar a variante.
4. `styles.css`: o bloco acima.
5. `components.json` + `npx @react-native-reusables/cli add <componentes>`.

## 3. NativeWind 4 + Tailwind 3 + RNR (caminho documentado)

- **Maduro e estável:** `4.2.7` (14/09/2026). É o caminho que o CLI do RNR instala por padrão (`tailwindcss@^3.4.14` e `tailwind.config.js`).
- **O tema não sobrevive.** O `react-native-css-interop@0.2.7` declara peer `tailwindcss: ~3` (`npm view`). O `theme.css` usa sintaxe exclusiva do Tailwind 4 (`@theme inline`, `@variant`, `@custom-variant`), e o Tailwind 3 não a lê. Seria preciso manter um `global.css` com as variáveis de `:root` e de `@media (prefers-color-scheme: dark)`, mais um `tailwind.config.js` mapeando `colors.primary: 'var(--primary)'` etc. **Custo de sincronia:** cerca de 45 tokens × 2 temas duplicados à mão, ou um script que lê o `theme.css` e gera os dois arquivos, mais um teste de CI que compara as saídas. Não verifiquei se o lightningcss `~1.27` do css-interop converte `oklch` dentro de variáveis CSS.
- **RN 0.86 já tem um bug aberto:** com o preset `nativewind/babel`, a UI do LogBox quebra. Um relato com Expo 57 / RN 0.86.3 mostra que o problema vai além do LogBox e afeta `Pressable` no app. Só há patch comunitário ([nativewind #1834](https://github.com/nativewind/nativewind/issues/1834)). O suporte ao RN 0.88 **não foi verificado**.
- **É um passo para trás:** o mobile já está no Tailwind 4, e o web também. Voltar para o 3 cria uma segunda configuração de Tailwind no monorepo.

## 4. Tamagui

- **Maturidade:** muito ativo. `3.0.0` em 10/10/2026, `3.1.2` em 21/10/2026, e às vezes saem várias versões por dia. O mantenedor é praticamente um só (natew, com 16,3 mil commits). São 14,3 mil estrelas e 94 abertos.
- **SDK 58:** a v3.1.0 inclui "upgrade One 2.8 (React Native 0.88, React 19.3, Expo 58)" ([releases](https://github.com/tamagui/tamagui/releases)). É o candidato com a compatibilidade mais adiantada.
- **Componentes:** tem quase tudo pronto, incluindo `Sheet`, `Toast`, `Select`, `Tabs`, `Dialog`, `AlertDialog`, `Form`, `Input` e `ListItem`. Não tem `Skeleton` nem campo numérico ([UI intro](https://tamagui.dev/ui/intro)).
- **O tema não sobrevive.** O `@tamagui/tailwind` da v3 "Tailwind CSS utility authoring" resolve as classes contra os tokens do `tamagui.config.ts`, não contra um CSS do Tailwind ([docs](https://tamagui.dev/docs/core/tailwind)). Seria preciso gerar os temas `light` e `dark` do Tamagui a partir do `theme.css`, com um script que converte `oklch` para hex (por exemplo com `culori`) e um teste de sincronia.
- **Vocabulário:** próprio (`YStack`, `XStack`, `Adapt`, tokens `$color`), diferente do shadcn. O `className` existe, mas em outro motor.
- **Custo:** compilador próprio (`@tamagui/static`), Babel/Metro, provider e config. É o maior custo de adoção da lista.

## 5. gluestack-ui v5

- **Maturidade:** o `@gluestack-ui/core` está em `5.0.15` (25/06/2026), e o CLI `gluestack-ui` em `5.0.3`. Desde junho, os commits no `main` são só da landing page. O repo tem 5,3 mil estrelas e 20 abertos, e a API do GitHub não mostra licença SPDX.
- **Motor:** NativeWind v5 ou Uniwind, os dois com Tailwind 4 ([Installation](https://gluestack.io/ui/docs/home/getting-started/installation)).
- **Expo 57:** o `init` falhava num projeto novo do SDK 57. A saída foi criar o projeto no 56 e atualizar ([#3434](https://github.com/gluestack/gluestack-ui/issues/3434)). O RN 0.88 **não foi verificado**.
- **Componentes:** cobre tudo o que o app precisa, incluindo `Toast`, `Actionsheet`, `Select`, `Tabs`, `Skeleton`, `FormControl`, `Modal` e `Drawer`. Acessibilidade: "ARIA support baked in".
- **O tema não sobrevive como está.** Os tokens ficam em `config.ts`, com `vars()` em **triplas RGB** (`'--color-primary': '51 51 51'`), e o `global.css` faz `rgb(var(--color-primary))` ([Dark mode](https://gluestack.io/ui/docs/home/theme-configuration/dark-mode)). O `vars` está marcado como deprecated no `react-native-css`. A escala de cor também é própria (`primary-0…950`). Seria preciso um gerador `oklch` → RGB e um mapeamento de nomes.
- **Vocabulário:** parecido com o NativeBase (`Actionsheet`, `FormControl`, `Box`), não com o shadcn.

## 6. Outras opções do mercado

| Opção | Situação | Veredito |
|---|---|---|
| **HeroUI Native** (`heroui-native` 1.0.11) | Estável desde mar/2026, release mensal, mantido pela HeroUI Inc (Apache-2.0, 3,7 mil estrelas, 6 abertos). Usa Uniwind e Tailwind 4, tokens em `oklch`, e já suporta Expo 58 / RN 0.88 ([PR #528](https://github.com/heroui-inc/heroui-native/pull/528)). Tem `Toast`, `BottomSheet`, `Select`, `Dialog` e `TextField`. | **Concorrente real.** Roda sobre o mesmo motor recomendado, então o tema chega pelo mesmo caminho. Mas os nomes dos tokens são outros (`--accent`, `--danger`, `--success`; [Theming](https://heroui.com/docs/native/getting-started/theming)), o que pede uma camada de mapeamento `--accent: var(--primary)`, e o vocabulário é do HeroUI, não do shadcn. Também puxa `@gorhom/bottom-sheet`, `expo-blur` e `tailwind-variants` como peers. Fica como alternativa se o RNR estagnar. |
| **Expo UI** (`@expo/ui` 57.0.25) | First-party, com componentes SwiftUI/Jetpack Compose e um conjunto "Universal" (`BottomSheet`, `Picker`, `TextInput`, `Switch`, `Slider`…). Estável no SDK 58 ([docs](https://docs.expo.dev/versions/latest/sdk/ui/)). Não usa `className`: "Once you are inside the native context, Yoga is not available." | **Complemento, não base.** Serve para controles pontuais com cara nativa (picker de data, bottom sheet), mas não aplica o tema do web. |
| **React Native Paper** 5.15.3 | Material Design 3, tema em objeto JS, v6 em alpha. 497 issues abertas. | Fora: visual Material, sem Tailwind, sem o vocabulário do shadcn. |
| **Unistyles 3** 3.5.3 | Motor de estilo (StyleSheet + Nitro), do mesmo autor do Uniwind. Não tem componentes. | Fora: exigiria um tema em JS e uma biblioteca de componentes à parte. |
| **Restyle** 2.4.5 | Última release em mar/2025. Não tem componentes. | Fora: parado. |
| **rn-primitives** direto (1.5.2) | São a base do RNR (o mesmo autor, mrzachnugent). | Já está incluído na recomendação: o RNR é rn-primitives com estilo shadcn. |
| **NativewindUI** | Kit pago da Founded Labs, com foco em visual nativo iOS. | Fora: pago, e não segue o shadcn. |

## 7. Cobertura de componentes que o app precisa

| Necessidade | RNR (NW5 ou Uniwind) | Tamagui | gluestack v5 | HeroUI Native |
|---|---|---|---|---|
| Formulário multi-etapas | Não tem stepper. Compõe-se com RHF + Zod + estado de etapa (nenhuma das opções tem stepper pronto). | Igual | Igual | Igual |
| Entrada numérica | `Input` + `keyboardType="decimal-pad"` (nenhuma tem um NumberField nativo verificado) | `Input` | `Input` | `TextField` |
| Select | `Select` (rn-primitives, `role='combobox'`/`option`) | `Select` | `Select` | `Select` |
| Tabs | `Tabs` (`role='tablist'`/`tab`) | `Tabs` | `Tabs` | não verificado |
| Lista | `FlatList`/FlashList (fora de qualquer kit) | `ListItem` | — | — |
| Toast | **Não tem.** `sonner-native` 0.27 (peers de Reanimated 4, Worklets e Screens compatíveis) | `Toast` | `Toast` | `Toast` |
| Dialog / Sheet | `Dialog`, `AlertDialog`. **Sheet não tem:** `@gorhom/bottom-sheet` 5.2.14 ou `presentation: "formSheet"` do expo-router | `Dialog`, `Sheet` | `Modal`, `Actionsheet` | `Dialog`, `BottomSheet` |
| Skeleton | `Skeleton` | não tem | `Skeleton` | não verificado |

**Acessibilidade.** Os primitivos do RNR usam as props `role` e `aria-*` do RN (`role='dialog'`, `aria-modal`, `aria-expanded`, `aria-selected`, contadas no `dist` de `@rn-primitives/select`, `tabs` e `dialog` 1.5.2). Tamagui e gluestack afirmam ter acessibilidade embutida. Não testei nenhuma opção com leitor de tela.

## 8. Tabela comparativa

| | NW5 + RNR | **Uniwind + RNR** | NW4 + TW3 + RNR | Tamagui | gluestack v5 | HeroUI Native |
|---|---|---|---|---|---|---|
| Versão estável | Não (rc.0, "not for production") | **Sim** (1.13.0) | Sim (4.2.7) | Sim (3.1.2) | Sim (5.0.15) | Sim (1.0.11) |
| Cadência / saúde | 1 mantenedor, 132 abertos no `react-native-css` | 2 mantenedores, 7 abertos, release a cada 2–4 semanas | Só manutenção | Diária, 1 mantenedor | Parado desde jun/2026 | Mensal, empresa |
| Expo 57 / nova arquitetura | Sim (o rc foi feito para o 57) | Sim | Bug aberto no RN 0.86 (#1834) | Sim | Com tropeço no `init` | Sim |
| RN 0.88 / SDK 58 | **Bug aberto** (`AssetRegistry`) | **Corrigido** (1.13.0) | Não verificado | Sim (3.1.0) | Não verificado | Sim (PR #528) |
| `theme.css` compartilhado | **Sim, sem mudança** | **Sim, +1 bloco CSS** (verificado no build) | Não (duplicar ou gerar) | Não (gerar) | Não (gerar RGB e renomear) | Parcial (mapear nomes) |
| Escuro do sistema | Sim | Sim (tema `system`) | Sim | Sim | Sim (`mode="system"`) | Sim |
| Vocabulário shadcn | Sim | Sim | Sim | Não | Não | Não |
| Lacunas de componentes | toast, sheet | toast, sheet; `group-*` sem efeito | toast, sheet | skeleton | — | a verificar |
| Custo de adoção | Mínimo (já instalado; ajustar `icon.tsx`) | Baixo (metro + CSS + deps) | Médio (Tailwind 3, config, tokens) | Alto | Médio | Médio |

## O que reverteria a recomendação

- **O NativeWind 5 sai estável, com o conserto do RN 0.88, antes da primeira release do app.** Então vale ficar nele: o tema funciona sem a redeclaração, `group-*` funciona de graça, e o app já está configurado.
- **A troca de tema não funciona em aparelho** com o formato do `theme.css` (claro em `:root`, escuro em variant), ou o Uniwind passa a exigir `@variant light`. Aí o custo do Uniwind sobe: seria preciso manter um tema reformatado para o mobile.
- **O design precisa de `group-*` de verdade** (estados de pressão que propagam para filhos), e o projeto não quer pagar o Uniwind Pro.
- **O RNR estagna.** Ele e o rn-primitives dependem de um mantenedor principal (mrzachnugent, com 1.116 commits); a última atividade no repo foi em 27/09/2026. Se isso acontecer, o HeroUI Native sobre o mesmo Uniwind é o plano B mais barato.
- **O app passa a precisar de visual nativo de plataforma** em vez da identidade do web. Nesse caso, o Expo UI ganha peso.

## Fontes

- npm registry (`npm view <pacote> dist-tags time peerDependencies dependencies`) para `nativewind`, `react-native-css`, `react-native-css-interop`, `uniwind`, `tamagui`, `@gluestack-ui/core`, `gluestack-ui`, `heroui-native`, `react-native-paper`, `react-native-unistyles`, `@shopify/restyle`, `@rn-primitives/*`, `@expo/ui`, `expo`, `react-native`, `sonner-native`, `@gorhom/bottom-sheet`, `@shopify/flash-list`. Downloads: `api.npmjs.org/downloads/point/last-week`.
- Código publicado: `nativewind@5.0.0-rc.0` (`src/index.tsx`, `theme.css`), `react-native-css@3.1.0-rc.0` (`src/compiler/compiler.ts`, `src/native/api.tsx`, `src/runtime.types.ts`), `uniwind@1.13.0` (`uniwind.css`, `src/bundler/css-visitor/rule-visitor.ts`, `src/bundler/config.ts`, `src/bundler/css-processor/processor.ts`, `dist/metro/transformer.cjs`), `@rn-primitives/{select,tabs,dialog}@1.5.2`.
- React Native Reusables (`main`, set/2026): `packages/registry/src/{nativewind,uniwind}`, `packages/registry/package.json`, `apps/cli/src/project-manifest.ts`, `apps/docs/content/docs/changelog.mdx`, `installation/manual.mdx`. Issue [#548](https://github.com/founded-labs/react-native-reusables/issues/548).
- NativeWind: [v5](https://www.nativewind.dev/v5), [#1834](https://github.com/nativewind/nativewind/issues/1834), [releases](https://github.com/nativewind/nativewind/releases); react-native-css: [releases](https://github.com/nativewind/react-native-css/releases), [#504](https://github.com/nativewind/react-native-css/pull/504), [#506](https://github.com/nativewind/react-native-css/issues/506).
- Uniwind: [Theming basics](https://docs.uniwind.dev/theming/basics), [Global CSS](https://docs.uniwind.dev/theming/global-css), [Supported classNames](https://docs.uniwind.dev/class-names), [Pro version](https://docs.uniwind.dev/pro-version), [release v1.13.0](https://github.com/uni-stack/uniwind/releases/tag/v1.13.0), [#732](https://github.com/uni-stack/uniwind/issues/732), [#737](https://github.com/uni-stack/uniwind/issues/737).
- Tamagui: [introdução](https://tamagui.dev/docs/intro/introduction), [Tailwind](https://tamagui.dev/docs/core/tailwind), [UI](https://tamagui.dev/ui/intro), [releases](https://github.com/tamagui/tamagui/releases).
- gluestack-ui: [Installation](https://gluestack.io/ui/docs/home/getting-started/installation), [Dark mode](https://gluestack.io/ui/docs/home/theme-configuration/dark-mode), [introdução](https://gluestack.io/ui/docs/home/overview/introduction), [#3434](https://github.com/gluestack/gluestack-ui/issues/3434).
- HeroUI Native: [Quick start](https://heroui.com/docs/native/getting-started/quick-start), [Theming](https://heroui.com/docs/native/getting-started/theming), [PR #528](https://github.com/heroui-inc/heroui-native/pull/528).
- Expo UI: [SDK latest](https://docs.expo.dev/versions/latest/sdk/ui/), [SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/ui/).
- GitHub API (`repos/<org>/<repo>` e `/contributors`) para estrelas, issues abertas, último push e mantenedores.
- Repositório: `apps/mobile/{package.json,metro.config.js,src/styles.css}` (branch `feat/mobile`), `tooling/tailwind/theme.css`, `packages/components/`, `docs/pesquisas/nativewind-tema.md`.
