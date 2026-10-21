import { View } from "react-native";

import { cn } from "~/utils/cn";

/*
 * Os picotes do bilhete, a versão em `View` dos `RecorteDoTicket` e
 * `PicoteVertical` do web (`apps/web/src/features/inscricoes/partes-do-ticket.tsx`).
 *
 * Sem SVG: a mordida é um disco `bg-background` com borda, centrado sobre a
 * borda do bilhete, e o bilhete (`overflow-hidden`) corta a metade de fora.
 * Por isso o bilhete precisa de `overflow-hidden` e de `border` de 1px; o
 * disco fica 11px para fora do conteúdo, 10px de raio mais a borda.
 *
 * O tracejado também não é `border-l-dashed`: no React Native o traço só sai
 * com a borda nos quatro lados. A linha é uma caixa tracejada inteira dentro
 * de uma faixa de 1px que esconde os outros três lados.
 */

/** O picote deitado, entre o cabeçalho e o rodapé do bilhete de grupo. */
export function PicoteHorizontal() {
    return (
        <View aria-hidden className="relative h-px">
            <Mordida className="-top-2.5 -left-[11px]" />
            <View className="mx-3 h-px flex-1 overflow-hidden">
                <View className="border-border absolute -inset-x-px top-0 h-2 border border-dashed" />
            </View>
            <Mordida className="-top-2.5 -right-[11px]" />
        </View>
    );
}

/** O picote de pé, entre o canhoto e o miolo do bilhete individual. */
export function PicoteVertical() {
    return (
        <View aria-hidden className="relative w-px self-stretch">
            <Mordida className="-top-[11px] -left-2.5" />
            <View className="my-3 w-px flex-1 overflow-hidden">
                <View className="border-border absolute -inset-y-px left-0 w-2 border border-dashed" />
            </View>
            <Mordida className="-bottom-[11px] -left-2.5" />
        </View>
    );
}

function Mordida({ className }: { className: string }) {
    return (
        <View
            className={cn(
                "bg-background border-border absolute size-5 rounded-full border",
                className,
            )}
        />
    );
}
