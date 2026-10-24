# Animação entre etapas do formulário no mobile

Pesquisa sobre como animar a troca de etapa de `FormularioFicha` (`apps/mobile/src/features/avaliacoes/components/formulario-ficha.tsx`, então `FormularioFichaMock`): a próxima etapa entra pela direita, a anterior pela esquerda e, mais tarde, um gesto de arrastar volta uma etapa. Versões no `yarn.lock`: `expo@57.0.30`, `react-native@0.86.3`, `react-native-reanimated@4.5.1`, `react-native-worklets@0.10.1`, `react-native-gesture-handler@2.32.0`, `react-native-screens@4.26.2`. Fontes consultadas em 22/10/2026.

## Recomendação

**Nenhuma biblioteca nova. Usar as layout animations do Reanimated 4, que já está instalado e já é usado no app.** O `IconeEstadoFila` usa uma animação CSS do Reanimated hoje.

- O Reanimated está no Expo Go, e o Expo 57 fixa a versão em `4.5.1`, a mesma do `package.json` (`node_modules/expo/bundledNativeModules.json`; [Expo: Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)). A matriz de compatibilidade do 4.5.x cobre RN 0.83 a 0.86 com Worklets 0.10.x, só na New Architecture ([`compatibility.json` @ 4.5.1](https://github.com/software-mansion/react-native-reanimated/blob/4.5.1/packages/react-native-reanimated/compatibility.json)).
- `entering`/`exiting` resolvem o caso de "um bloco sai, outro entra" sem medir largura nem manter um `translateX` à mão. Os presets `SlideInRight`, `SlideInLeft`, `SlideOutLeft` e `SlideOutRight` já existem ([Entering/Exiting](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations)).
- O gesto de voltar, quando vier, sai do `react-native-gesture-handler` (`Gesture.Pan`), também já instalado e presente no Expo Go ([Expo: Gesture Handler](https://docs.expo.dev/versions/latest/sdk/gesture-handler/)), movendo um shared value do Reanimated.
- Como base geral de animação do app, o Reanimated é a escolha certa. As alternativas de mais alto nível (Moti) estão paradas ou dependem do próprio Reanimated (Moti, reanimated-carousel). O Motion do web não tem versão para React Native. Os detalhes estão na seção [Alternativas](#alternativas).

O ponto que exige cuidado é a **direção**. O `exiting` da etapa que sai é registrado no último commit em que ela existiu, não no commit que a remove. Por isso a direção não pode vir só do `entering`/`exiting` escolhido no render que troca a etapa. A solução é uma animação customizada que lê a direção de um shared value. Ela está em [Direção](#direção-avançar-e-voltar).

## Como encaixa no componente atual

Hoje o `ScrollView` tem `key={atual}` para cada etapa começar do topo. A mudança é mover a chave para um `Animated.View` que envolve o `ScrollView`, dentro de um contêiner com `overflow-hidden`. Na troca, a etapa velha desmonta (`exiting`) e a nova monta (`entering`), as duas ao mesmo tempo.

```tsx
import Animated, {
    LayoutAnimationConfig,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import type {
    EntryAnimationsValues,
    ExitAnimationsValues,
    SharedValue,
} from "react-native-reanimated";

const DURACAO = 250;

// +1 = avançar (entra pela direita), -1 = voltar (entra pela esquerda).
function entrada(direcao: SharedValue<1 | -1>) {
    return (v: EntryAnimationsValues) => {
        "worklet";
        return {
            initialValues: {
                originX: v.targetOriginX + direcao.value * v.windowWidth,
            },
            animations: {
                originX: withTiming(v.targetOriginX, { duration: DURACAO }),
            },
        };
    };
}

function saida(direcao: SharedValue<1 | -1>) {
    return (v: ExitAnimationsValues) => {
        "worklet";
        return {
            initialValues: { originX: v.currentOriginX },
            animations: {
                originX: withTiming(
                    v.currentOriginX - direcao.value * v.windowWidth,
                    { duration: DURACAO },
                ),
            },
        };
    };
}

// No componente:
const direcao = useSharedValue<1 | -1>(1);
const animEntrada = useMemo(() => entrada(direcao), [direcao]);
const animSaida = useMemo(() => saida(direcao), [direcao]);

function irPara(destino: number) {
    direcao.value = destino > atual ? 1 : -1;
    Keyboard.dismiss();
    setAtual(destino);
}

// No JSX, no lugar do <ScrollView key={atual}>:
<LayoutAnimationConfig skipEntering>
    <View className="flex-1 overflow-hidden">
        <Animated.View
            key={atual}
            entering={animEntrada}
            exiting={animSaida}
            style={{ flex: 1 }}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-5 p-4 pb-8"
            >
                {/* conteúdo da etapa ou da revisão, igual hoje */}
            </ScrollView>
        </Animated.View>
    </View>
</LayoutAnimationConfig>;
```

Notas sobre o esboço:

- **`LayoutAnimationConfig skipEntering`** evita que a primeira etapa deslize ao abrir a tela. Ele pula os `entering` dos filhos quando o próprio `LayoutAnimationConfig` monta. Trocas posteriores animam normalmente ([LayoutAnimationConfig](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-animation-config)).
- **Builders e funções fora do render, ou em `useMemo`**: a documentação recomenda isso por desempenho ([Entering/Exiting, Remarks](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations)).
- **`Animated.View` com `style`, não `className`.** O `IconeEstadoFila` já segue esse padrão. As classes de animação do Uniwind (`uw-entering-slide-in-right` e afins) são recurso do Uniwind Pro, e o app usa o `uniwind` gratuito ([Uniwind Pro: Reanimated](https://docs.uniwind.dev/pro/reanimated-animations)).
- **Animações customizadas** recebem `targetOriginX`/`windowWidth` (entrada) e `currentOriginX`/`windowWidth` (saída), começam com `'worklet'` e devolvem `initialValues` + `animations` ([Custom animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations)). Os presets `SlideIn*` fazem o mesmo: animam `originX` a partir de `targetOriginX + windowWidth` (`src/layoutReanimation/defaultAnimations/Slide.ts` no pacote instalado).
- **Duração.** Os presets usam 300 ms por padrão ([Entering/Exiting](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations)). 200 a 250 ms costumam bastar para uma troca que a pessoa dispara muitas vezes, mas é uma escolha de design, não uma regra da documentação.

## Direção: avançar e voltar

O caminho óbvio seria escolher `entering={indo ? SlideInRight : SlideInLeft}` e `exiting={indo ? SlideOutLeft : SlideOutRight}` no render. Para o `entering` isso funciona, porque o elemento novo monta já com a prop do render atual. Para o `exiting`, não.

No `AnimatedComponent` do Reanimated, a configuração de `EXITING` é enviada ao nativo em `componentDidMount` e em `componentDidUpdate` ([`AnimatedComponent.tsx` @ 4.5.1](https://github.com/software-mansion/react-native-reanimated/blob/4.5.1/packages/react-native-reanimated/src/createAnimatedComponent/AnimatedComponent.tsx)). Quando a `key` muda, o elemento velho não renderiza de novo: ele desmonta com o `exiting` do último render em que existiu. Se a pessoa avançou e depois voltou, a etapa que sai ainda carrega o `exiting` de "avançar".

Duas saídas:

1. **Shared value lido dentro do worklet** (o esboço acima). As funções de animação são registradas uma vez, e a direção é lida quando a animação começa, na thread de UI. A documentação de animações customizadas não diz explicitamente que se pode ler um shared value ali ([Custom animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations)), mas a função é um worklet comum. **Validar no tablet** que a escrita em `direcao.value` chega à thread de UI antes do commit que desmonta a etapa.
2. **Duas fases em React**: primeiro um `setState` que só muda a direção (o elemento atual re-renderiza com o `exiting` certo), depois a troca de etapa num `useEffect`. É determinístico e custa um render a mais. É a alternativa se a primeira se mostrar instável.

## Acessibilidade e teclado

- **Reduzir movimento.** Toda animação do Reanimated usa `ReduceMotion.System` por padrão. Com a preferência ligada, `withTiming` pula direto para o valor final, `entering` e keyframes vão para o estado final e `exiting` é omitido ([Accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility)). Como o esboço usa `withTiming` dentro dos worklets, a troca fica instantânea sem código extra. Os presets aceitam `.reduceMotion(...)` para mudar isso.
- **`useReducedMotion` lê a preferência só na inicialização** e não re-renderiza quando ela muda (`src/hook/useReducedMotion.ts` no pacote instalado). Para reagir em tempo real, use `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)`. No Android, esse evento também fica `true` com "Escala de animação de transição" desligada nas opções de desenvolvedor ([AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)). Para a troca de etapa não é preciso nada além do comportamento padrão.
- **Foco do leitor de tela.** Ao trocar de etapa, a etapa velha desmonta e o foco fica sem dono. Leve o foco ao título da etapa nova com `AccessibilityInfo.setAccessibilityFocus` (ou anuncie com `announceForAccessibility`) depois da troca ([AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)). O `Progresso` já expõe `aria-valuetext`, e isso continua valendo.
- **Teclado.** Se um `TextInput` focado desmonta no meio do deslize, o teclado fica aberto sobre a etapa nova. Por isso o esboço chama `Keyboard.dismiss()` antes de `setAtual`. O `KeyboardAvoidingView` atual fica como está. Há um bug aberto no iOS em que animações congelam por um instante quando o teclado abre ou fecha ([#10881](https://github.com/software-mansion/react-native-reanimated/issues/10881)). O app roda no Android, então isso não pesa agora.

## Problemas conhecidos das layout animations

- **New Architecture, `nativeID` e view flattening.** O `entering` depende do `nativeID`, então componentes que o sobrescrevem (como `TouchableWithoutFeedback`) impedem a animação. Uma view pai não animada também não espera as animações dos filhos, por causa do view flattening; `collapsable={false}` contorna isso ([Entering/Exiting, Remarks](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations)). O esboço anima um `Animated.View` próprio, sem esses componentes no meio.
- **Correções no 4.5.0** (23/06/2026), a linha que o Expo 57 usa: views saindo que ficavam presas no Android sob carga, um deadlock (ANR) no Android entre o registro de CSS e o commit do Fabric, e um vazamento de memória ao desmontar uma view no meio da animação ([Reanimated 4.5.0](https://swmansion.com/changelog/reanimated-4-5-0/)).
- **Ainda abertos e relevantes:** possível vazamento de memória no Android ao alternar muitas vezes um `Animated.View` condicional com `entering`/`exiting`, medido em cerca de 300 trocas ([#9250](https://github.com/software-mansion/react-native-reanimated/issues/9250)); e comportamento inconsistente das layout animations com `display: 'none'` no Fabric ([#10396](https://github.com/software-mansion/react-native-reanimated/issues/10396)). O padrão do esboço é exatamente o do #9250. Uma ficha tem poucas etapas, mas vale observar a memória numa sessão longa de avaliações.
- **Motor novo no 4.7.** O Reanimated 4.7.0 (18/09/2026) passa a usar um motor novo de layout animations por padrão. Entre as correções, estão views saindo que ficam na posição do host e views reparentadas ([Reanimated 4.7.0](https://swmansion.com/changelog/reanimated-4-7-0/)). Ele suporta RN 0.86 a 0.88 com Worklets 0.13.x, mas **não roda no Expo Go do SDK 57**, que traz o nativo 4.5.1. Só fica disponível com o dev client planejado, e mesmo assim fora da versão que o Expo 57 recomenda.

## Gesto de voltar (depois)

- **Caminho:** `GestureDetector` com `Gesture.Pan()` sobre a área da etapa. O gesto move um `translateX` (shared value) da etapa atual e, ao soltar além de um limiar, chama `irPara(atual - 1)` via `runOnJS`/`scheduleOnRN`. Aí a troca deixa de ser só layout animation: durante o arrasto a etapa anterior precisa estar visível atrás, então o gesto exige renderizar as duas etapas e animar por `useAnimatedStyle`. A documentação de CSS transitions indica `useAnimatedStyle` com shared values para animações guiadas por gesto ([CSS transitions](https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/overview)).
- **Pré-requisito:** o app não tem `GestureHandlerRootView` hoje (nenhuma ocorrência em `apps/mobile/src`). O Gesture Handler exige envolver a raiz com ele ([Gesture Handler: Getting started](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/getting-started)).
- **Conflito com o voltar do sistema.** No Android com navegação por gestos, deslizar a partir de qualquer borda lateral é o "voltar" do sistema ([Android: gesture navigation](https://developer.android.com/develop/ui/views/touch-and-input/gestures/gesturenav)). O gesto de etapa deve começar longe da borda, e o voltar do sistema (`BackHandler`) deve levar à etapa anterior em vez de sair da ficha.

## Alternativas

| Opção | Última versão | New Arch | Expo Go SDK 57 | Ganho sobre o Reanimated puro |
| --- | --- | --- | --- | --- |
| **Reanimated 4 (layout animations)** | 4.5.1 fixado pelo Expo 57; 4.7.1 é a mais recente (npm) | Só New Arch no 4.x ([compatibility.json](https://github.com/software-mansion/react-native-reanimated/blob/4.5.1/packages/react-native-reanimated/compatibility.json)) | Sim ([Expo](https://docs.expo.dev/versions/latest/sdk/reanimated/)) | — (recomendado) |
| **Moti** | 0.30.0, de 29/01/2025 (npm) | Issue aberta sobre Reanimated 4 e Expo 54 ([#391](https://github.com/nandorojo/moti/issues/391)), com relato de "migrei para outra lib" em 06/2026; último commit em 03/2025 | Usa o Reanimated do app | API declarativa, mas sem manutenção. Descartar. |
| **react-native-pager-view** | 9.0.9 (16/10/2026); o Expo 57 fixa 8.0.2 | Só New Arch desde 7.x ([README](https://github.com/callstack/react-native-pager-view)) | Sim ([Expo: ViewPager](https://docs.expo.dev/versions/latest/sdk/view-pager/)) | Arrastar nativo de graça. Mas a validação por etapa exige bloquear o arrasto para frente, e aí sobra pouco do ganho. Reavaliar quando o gesto vier. |
| **FlatList/ScrollView horizontal com `pagingEnabled`** | parte do RN | — | — | Mesmo trade-off do pager, com todas as etapas montadas lado a lado e altura comum. Não compensa. |
| **Uma rota do expo-router por etapa** | expo-router ~57.0.28 | sim (native stack) | Sim | Animação nativa e "voltar" do sistema de graça. Mas o estado do `react-hook-form` precisa subir para um contexto compartilhado entre rotas, o progresso e o rodapé deslizam junto com a tela, e o gesto de arrastar para voltar é só iOS (`gestureEnabled`, `fullScreenGestureEnabled`) ([React Navigation: native stack](https://reactnavigation.org/docs/native-stack-navigator/), [Expo Router: Stack](https://docs.expo.dev/router/advanced/stack/)). Pesa mais do que ajuda. |
| **react-native-reanimated-carousel** | 5.2.0 (14/10/2026) | peer: Reanimated ≥ 4.1, Worklets ≥ 0.5, RN ≥ 0.80 (npm) | Só JS sobre Reanimated + Gesture Handler | Feito para carrossel, não para formulário com validação. Descartar. |
| **Motion (motion.dev)** | — | — | — | Sem versão para React Native. A documentação descreve só o navegador ([Motion for React](https://motion.dev/docs/react)). As convenções de `docs/animacoes.md` não se transportam. |
| **`Animated` do React Native** | parte do RN | sim | sim | Roda na thread de UI com `useNativeDriver: true` ([Animated](https://reactnative.dev/docs/animated)), mas não tem animação de desmontagem. Seria preciso manter as duas etapas montadas e sequenciar à mão. Sem vantagem com o Reanimated instalado. |

## O que não foi verificado

- Que escrever num shared value no thread JS logo antes de `setAtual` é visto pelo worklet de `exiting` da mesma troca. A documentação não trata desse caso; daí a alternativa em duas fases.
- Como o `exiting` se posiciona no motor antigo (4.5.1) quando a nova etapa ocupa o mesmo espaço. O changelog do 4.7 cita uma correção para "exiting views staying at their host position", o que sugere diferenças entre os motores. Testar no tablet antes de fechar a duração e o `overflow-hidden`.
- Se o `react-native-pager-view` 8.0.2 (a versão do Expo 57) monta todas as páginas ou só as vizinhas. Só importa se o gesto for feito com ele.
