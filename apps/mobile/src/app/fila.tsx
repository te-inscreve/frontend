import { useRouter } from "expo-router";

import { DetalheFila } from "~/features/avaliacoes/components/detalhe-fila";
import { useFila } from "~/features/avaliacoes/lib/use-fila";

/**
 * O detalhe da fila, aberto pelo estado no cabeçalho. Apresentado como
 * `formSheet` no layout raiz: fica sobre o app logado sem desmontá-lo, então
 * o cabeçalho e as abas continuam onde estavam ao fechar.
 */
export default function Fila() {
    const fila = useFila();
    const router = useRouter();

    return <DetalheFila fila={fila} onFechar={() => router.back()} />;
}
