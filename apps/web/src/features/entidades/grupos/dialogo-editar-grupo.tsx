"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@te-inscreve/components";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import { FormGrupoEntidade } from "./form-grupo";

interface Props {
    grupo: GrupoDetalhe;
    open: boolean;
    onOpenChange: (aberto: boolean) => void;
    onEditar: (dados: FormGrupo) => Promise<void> | void;
}

/**
 * O formulário de edição do grupo, aberto pelo menu de ações.
 *
 * `Dialog` comum, e não a expansão do gatilho: quem abre é um item de menu, que
 * deixa de existir no instante em que o menu fecha — não há de onde o modal
 * crescer nem para onde ele voltar. Expandir a partir de um elemento que some é
 * justamente o caso que `docs/animacoes.md` manda evitar.
 *
 * Fica fora do menu, e controlado por ele, porque o item precisa segurar o
 * `onSelect`: sem isso o Radix fecha o menu e o diálogo antes de ele montar —
 * mesmo arranjo de {@link AcoesEvento}.
 */
export function DialogoEditarGrupo({
    grupo,
    open,
    onOpenChange,
    onEditar,
}: Props) {
    /** Fecha só quando salvou: nome repetido mantém o que foi digitado. */
    const editar = async (dados: FormGrupo) => {
        await onEditar(dados);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PencilSimpleIcon aria-hidden="true" weight="bold" />
                        Editar grupo
                    </DialogTitle>
                    <DialogDescription>
                        O nome e a descrição do grupo. A formação se muda pela
                        lista de integrantes, e não aqui.
                    </DialogDescription>
                </DialogHeader>

                <FormGrupoEntidade
                    // O formulário nasce do grupo em edição; sem a chave, reabrir
                    // depois de um "Cancelar" traria o rascunho da vez passada.
                    key={`${grupo.id}-${String(open)}`}
                    grupo={grupo}
                    onSalvar={editar}
                    onCancelar={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
