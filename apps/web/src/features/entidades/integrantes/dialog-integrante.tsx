"use client";

import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

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
import { FormIntegrante } from "./form-integrante";

interface Props {
    aberto: boolean;
    onAbertoChange: (aberto: boolean) => void;
    onSalvar: (integrante: Omit<Integrante, "id">) => Promise<void> | void;
}

/**
 * O cadastro de integrante em um diálogo, aberto pelo botão da listagem.
 *
 * A abertura é controlada de fora porque quem fecha é o salvamento: só depois
 * de o cadastro dar certo é que a tela volta para a lista, já com a pessoa
 * nova. Enquanto o envio falha, o diálogo fica aberto com o que foi digitado.
 */
export function DialogIntegrante({ aberto, onAbertoChange, onSalvar }: Props) {
    return (
        <Dialog open={aberto} onOpenChange={onAbertoChange}>
            <DialogTrigger asChild>
                <Button type="button">
                    <PlusIcon aria-hidden="true" />
                    Adicionar
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-primary flex items-center">
                        <UserIcon
                            aria-hidden="true"
                            className="mr-2"
                            weight="bold"
                        />
                        Novo integrante
                    </DialogTitle>
                    <DialogDescription>
                        Cadastre um integrante para que ele possa ser inscrito
                        em eventos e vinculado a grupos.
                    </DialogDescription>
                </DialogHeader>

                <FormIntegrante
                    onSalvar={onSalvar}
                    onCancelar={() => onAbertoChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
