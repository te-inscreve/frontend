"use client";

import { useWatch } from "react-hook-form";

import type { CampoDaFolha } from "../ficha-avaliativa/folha-modelo-ficha";
import type {
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import { FolhaModeloFicha } from "../ficha-avaliativa/folha-modelo-ficha";
import { useEditor } from "./editor-contexto";
import { campoDaPosicao } from "./posicao-editavel";

/**
 * A ficha montada até aqui, na mesma prancheta do detalhe do modelo: o que o
 * formulário tem agora, sem esperar o salvar.
 */
export function PreviaModeloFicha() {
    const { camposGlobais } = useEditor();
    const [nome, camposGerais, agrupamentos] = useWatch<
        ModeloFichaFormValues,
        ["nome", "camposGerais", "agrupamentos"]
    >({ name: ["nome", "camposGerais", "agrupamentos"] });

    // Uma posição cujo campo global não está no catálogo não tem o que
    // desenhar: fica de fora, como no editor.
    const camposDaFolha = (posicoes: PosicaoForm[]) =>
        posicoes.flatMap((posicao): CampoDaFolha[] => {
            const campo = campoDaPosicao(posicao, camposGlobais);
            return campo ? [{ chave: posicao.chave, campo }] : [];
        });

    return (
        <FolhaModeloFicha
            nome={nome.trim() || "Modelo sem nome"}
            camposGerais={camposDaFolha(camposGerais)}
            agrupamentos={agrupamentos.map((agrupamento, indice) => ({
                chave: agrupamento.chave,
                nome: agrupamento.nome.trim() || `Agrupamento ${indice + 1}`,
                quantidade: agrupamento.quantidade,
                campos: camposDaFolha(agrupamento.campos),
            }))}
            mensagemVazia="A ficha ainda não tem campos. Volte à edição para montá-la."
        />
    );
}
