# Compartilhar os tokens de tema do web com NativeWind

Pesquisa do ticket [TE-67](https://linear.app/te-inscreve/issue/TE-67), filho do mapa [TE-64](https://linear.app/te-inscreve/issue/TE-64). Versões no `yarn.lock`: `nativewind@5.0.0-preview.4`, `react-native-css@3.0.7`, `tailwindcss@4.3.3`.

## Recomendação

**O app mobile importa o mesmo `theme.css`, sem formato intermediário gerado.** Isso já acontece hoje em `apps/mobile/src/styles.css`, e os tokens `oklch` chegam ao nativo convertidos para hex em tempo de build. O que falta é uma linha no CSS do mobile:

```css
/* apps/mobile/src/styles.css, depois do @import do tema */
@custom-variant dark (@media (prefers-color-scheme: dark));
```

Sem ela, **o tema escuro não chega ao nativo**: o bloco `@variant dark` do `theme.css` vira `:root:is(.dark *)`, um seletor que o compilador do `react-native-css` descarta sem aviso. O app fica sempre claro, mesmo com o sistema no escuro.

O web continua com seu próprio `@custom-variant dark (&:where(.dark, .dark *))` em `apps/web/src/app/styles.css`. Cada app declara o variant como precisa, e os tokens ficam num lugar só.

Ajustes menores, todos no mobile:

1. `font-sans` aponta para `var(--font-geist-sans)`, que só existe no web (vem do `next/font`). No nativo a variável não tem valor. O app precisa carregar a Geist (`expo-font`) e definir `--font-geist-sans` em `:root`, ou sobrescrever `--font-sans`.
2. O `rem` vale 14 no nativo e 16 no web. Para manter a escala do web (`p-4` = 16, `rounded-lg` = 12), use `inlineRem: 16` no `withNativewind`, ou `:root { font-size: 16px }` no CSS do mobile. Medir antes de decidir: 14 é o padrão do ecossistema RN.
3. Remover ou isolar o bloco `.dark { --sidebar: hsl(...) }` no fim do `theme.css`, sobra do template shadcn. No web, quando a classe `dark` existir, ele vai sobrescrever o sidebar escuro do tema com azul e cinza; no nativo vira uma classe `dark` inútil.
4. Trocar o fundo fixo do `Stack` em `apps/mobile/src/app/_layout.tsx` (`#09090B`/`#FFFFFF`, zinc do shadcn) pelos valores do tema.

## Como o tema chega ao nativo hoje

`apps/mobile/src/styles.css` importa as camadas do Tailwind uma a uma, depois `nativewind/theme`, e por último `@te-inscreve/tailwind-config/theme`, o mesmo arquivo que o web usa. O pipeline:

1. **Tailwind 4** (via `@te-inscreve/tailwind-config/postcss-config`, isto é, `@tailwindcss/postcss`) gera CSS comum: `:root { --primary: oklch(...) }` e utilitários como `.bg-primary { background-color: var(--primary) }`. Como o tema usa `@theme inline`, o utilitário referencia direto a variável de `:root` ([Tailwind: theme](https://tailwindcss.com/docs/theme)).
2. **`react-native-css`** (o compilador por trás do `withNativewind` no `metro.config.js`) passa esse CSS duas vezes pelo lightningcss e gera um stylesheet JSON: utilitários em `s`, variáveis de raiz em `vr`.

Rodei esse pipeline sobre o `styles.css` real do mobile (Tailwind 4.3.3, depois `compile()` de `react-native-css/compiler`). O resultado:

| Token | Saída nativa hoje | Com o `@custom-variant` proposto |
| --- | --- | --- |
| `--background` | `#fcfaf6` | `#141116` se escuro, senão `#fcfaf6` |
| `--primary` | `#4b8b3b` | `#74a669` se escuro, senão `#4b8b3b` |
| `--sidebar` | `#fff` | `#1a171c` se escuro, senão `#fff` |
| `--shadow-md` | sombra clara | sombra escura se escuro, senão clara |
| `dark:bg-card` | container query `g:dark` (exige ancestral com `className="dark"`) | `@media (prefers-color-scheme: dark)` |

### `oklch`: suportado e convertido no build

O lightningcss converte `oklch(...)` para hex na compilação (`Features.ColorFunction` em `src/compiler/compiler.ts`). `oklch(0.5751 0.1317 139.6817)` vira `#4b8b3b`, o mesmo verde do `adaptiveIcon.backgroundColor` em `app.config.ts`. O runtime nunca vê `oklch`. A documentação de cores do NativeWind v5 usa `oklch` no `@theme` ([Colors](https://www.nativewind.dev/v5/customization/colors)).

### `color-mix`: suportado em runtime

`bg-primary/50` gera `color-mix(in oklab, var(--primary) 50%, transparent)` dentro de um `@supports`. Com uma cor literal, o compilador resolve no build (`#42713880`). Com variável, ele emite uma chamada `colorMix` que o runtime resolve com `colorjs.io` (`src/native/styles/functions/color-mix.ts`). A documentação lista `color-mix()` entre as funções com polyfill no nativo ([Functions & Directives](https://www.nativewind.dev/v5/core-concepts/functions-and-directives)).

### `@theme inline`: funciona

O compilador do NativeWind não vê `@theme`; ele recebe o CSS que o Tailwind já expandiu. Com `inline`, `.bg-primary` aponta para `var(--primary)`, e essa variável está em `:root`. Uma armadilha: `--shadow-*` e `--tracking-normal` têm o mesmo nome em `:root` e no `@theme inline` (`--shadow-md: var(--shadow-md)`). O stylesheet nativo ganha uma entrada autorreferente que não quebra nada hoje, mas o padrão é frágil.

### Variáveis CSS: inlining no build

No nativo, toda propriedade customizada declarada **uma vez só** no CSS é inlinada no build; só as declaradas mais de uma vez (claro e escuro, `ios` e `android`) viram variáveis de runtime ([README do react-native-css](https://github.com/nativewind/react-native-css), opção `inlineVariables`). Para sobrescrever um token por JS (`VariableContextProvider`), ele precisa estar em `inlineVariables.exclude` ([Themes](https://www.nativewind.dev/v5/guides/themes)).

## Modo escuro no nativo

O NativeWind v5 só documenta um mecanismo: `dark:` é `@media (prefers-color-scheme: dark)`, reativo à aparência do sistema ([Dark Mode](https://www.nativewind.dev/v5/core-concepts/dark-mode)). A página de tema mostra exatamente o `@custom-variant dark (@media (prefers-color-scheme: dark))` que esta pesquisa recomenda ([Theme](https://www.nativewind.dev/v5/customization/theme)).

O que o compilador aceita para variáveis de raiz escuras (`getSelectors` em `src/compiler/selectors.ts`, confirmado compilando cada caso):

| CSS | Variável escura gerada? |
| --- | --- |
| `@media (prefers-color-scheme: dark) { :root { … } }` | Sim |
| `:root { &:is(.dark *) { … } }` (o que o `theme.css` gera hoje) | Não, descartado em silêncio |
| `:root:is(.dark *)`, `.dark:root`, `:root[class~=dark]` | Não |
| `.dark { … }` | Vira uma classe `dark` que define as variáveis no elemento, não na raiz |
| `light-dark(azul, vermelho)` | Sim, expandido em duas regras com a media query |

Para alternar manualmente, o NativeWind v5 manda usar `Appearance.setColorScheme("dark" | "light" | "unspecified")` do React Native; o `useColorScheme` próprio do NativeWind foi descontinuado ([Dark Mode](https://www.nativewind.dev/v5/core-concepts/dark-mode)). O runtime escuta `Appearance` (`src/native/reactivity.ts`) e também expõe `colorScheme.set()` (`src/native/api.tsx`). O `app.config.ts` já tem `userInterfaceStyle: "automatic"` e `expo-system-ui` instalado, que a página pede.

## O que não funciona (ou não está documentado)

- **Variant de tema por classe para tokens de raiz.** `:root.dark` e similares são rejeitados pelo compilador nativo ([Dark Mode](https://www.nativewind.dev/v5/core-concepts/dark-mode)). Por isso o variant `dark` precisa ser media query no mobile.
- **`@variant` e `@theme inline`** não aparecem na documentação do NativeWind ([Functions & Directives](https://www.nativewind.dev/v5/core-concepts/functions-and-directives)). Funcionam porque o Tailwind os resolve antes do compilador nativo, não porque o NativeWind os suporte.
- **`light-dark()`** não está documentado, mas o compilador o expande (teste acima).
- **Pseudo-classes além de `:hover`, `:active`, `:focus`, `:disabled` e `:empty`**, seletores universais e de id são descartados (`classNameSelector` em `src/compiler/selectors.ts`).
- **`calc()`** não mistura unidade numérica com porcentagem, limitação do Yoga ([Functions & Directives](https://www.nativewind.dev/v5/core-concepts/functions-and-directives)).
- **`env()`** só aceita `safe-area-inset-*` (mesma página).
- **Pré-lançamento.** Toda página do v5 avisa que a versão não é para produção.

## Por que não gerar um formato intermediário

Um gerador (JSON de tokens → CSS do web + objeto JS do mobile) resolveria um problema que não existe: o compilador nativo já lê `oklch`, `color-mix`, `@theme inline` e variáveis de `:root`, e converte tudo no build. Um formato a mais traria um passo de build e uma segunda fonte para os mesmos valores. Só vale reabrir a questão se o mobile precisar de valores do tema fora de `className`: cor da status bar, `screenOptions` do `Stack`, ícones. Para esses casos há o `useNativeVariable` do `react-native-css` ([README](https://github.com/nativewind/react-native-css)), antes de qualquer gerador.

## Fontes

- NativeWind v5: [Dark Mode](https://www.nativewind.dev/v5/core-concepts/dark-mode), [Theme](https://www.nativewind.dev/v5/customization/theme), [Themes](https://www.nativewind.dev/v5/guides/themes), [Colors](https://www.nativewind.dev/v5/customization/colors), [Functions & Directives](https://www.nativewind.dev/v5/core-concepts/functions-and-directives)
- [react-native-css (README)](https://github.com/nativewind/react-native-css) e código-fonte em `node_modules/react-native-css@3.0.7`: `src/compiler/compiler.ts`, `src/compiler/selectors.ts`, `src/compiler/declarations.ts`, `src/native/api.tsx`, `src/native/reactivity.ts`, `src/native/styles/functions/color-mix.ts`
- Tailwind CSS 4: [Dark mode](https://tailwindcss.com/docs/dark-mode), [Theme variables](https://tailwindcss.com/docs/theme)
- Repositório: `tooling/tailwind/theme.css`, `apps/web/src/app/styles.css`, `apps/mobile/src/styles.css`, `apps/mobile/metro.config.js`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/app.config.ts`
