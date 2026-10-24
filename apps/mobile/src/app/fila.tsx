import { useRouter } from "expo-router";

import { DetalheFila } from "~/features/avaliacoes/components/detalhe-fila";
import { useFila } from "~/features/avaliacoes/lib/use-fila";

/**
 * O detalhe da fila, aberto pela dock do cabeçalho. Apresentado como
 * `formSheet` no layout raiz: fica sobre o app logado sem desmontá-lo, então
 * o cabeçalho e as abas continuam onde estavam ao fechar.
 */
export default function Fila() {
    const fila = useFila();
    const router = useRouter();

    // A dock só abre a folha com a fila já lida; aqui é a mesma consulta, que
    // volta do banco antes de a folha terminar de subir.
    if (!fila) return null;
    return <DetalheFila fila={fila} onFechar={() => router.back()} />;
}
