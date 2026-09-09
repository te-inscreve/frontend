"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import type { FormIntegrante as DadosIntegrante } from "@te-inscreve/schemas";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { FormIntegrante } from "./form-integrante";

interface Props {
    integrante: Integrante;
    onEditar: (id: number, dados: DadosIntegrante) => Promise<void> | void;
}

/**
 * A edição de um integrante, aberta de dentro do detalhe dele.
 *
 * `Dialog` comum, e não o expansível: o formulário sai de um botão de barra,
 * não de um item da lista, e expandir tudo tiraria o significado da expansão
 * — ver AGENTS.md. Fecha sozinho quando o salvamento termina bem; enquanto
 * falha, fica aberto com o que foi digitado.
 */
export function DialogEditarIntegrante({ integrante, onEditar }: Props) {
    const [aberto, setAberto] = useState(false);

    return (
        <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <PencilSimpleIcon aria-hidden="true" />
                    Editar
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar integrante</DialogTitle>
                    <DialogDescription>
                        Altere os dados de {nomeCompleto(integrante)} como
                        constam na matrícula do MTG.
                    </DialogDescription>
                </DialogHeader>

                <FormIntegrante
                    integrante={integrante}
                    onSalvar={async (dados) => {
                        await onEditar(integrante.id, dados);
                        setAberto(false);
                    }}
                    onCancelar={() => setAberto(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
