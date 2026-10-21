"use client";

import { useWatch } from "react-hook-form";

import type {
    CampoDaFolha,
    ItemDaFolha,
} from "../ficha-avaliativa/folha-modelo-ficha";
import type {
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import { FolhaModeloFicha } from "../ficha-avaliativa/folha-modelo-ficha";
import { useEditor } from "./editor-contexto";
import { sequenciaDaFicha } from "./lib/modelo-ficha-form-schema";
import { campoDaPosicao } from "./posicao-editavel";

/**
 * A ficha montada até aqui, na mesma prancheta do detalhe do modelo: o que o
 * formulário tem agora, sem esperar o salvar, na sequência em que foi montada.
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

    const itens = sequenciaDaFicha({ camposGerais, agrupamentos }).flatMap(
        (item): ItemDaFolha[] => {
            if (item.tipo === "campo") {
                return camposDaFolha([item.posicao]).map((campo) => ({
                    tipo: "campo",
                    ...campo,
                }));
            }
            const { agrupamento } = item;
            return [
                {
                    tipo: "agrupamento",
                    chave: agrupamento.chave,
                    nome:
                        agrupamento.nome.trim() ||
                        `Agrupamento ${agrupamentos.indexOf(agrupamento) + 1}`,
                    quantidade: agrupamento.quantidade,
                    campos: camposDaFolha(agrupamento.campos),
                },
            ];
        },
    );

    return (
        <FolhaModeloFicha
            nome={nome.trim() || "Modelo sem nome"}
            itens={itens}
            mensagemVazia="A ficha ainda não tem campos. Volte à edição para montá-la."
        />
    );
}
