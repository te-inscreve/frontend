"use client";

import { useState } from "react";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";

import type { EntidadeOpcao } from "@te-inscreve/schemas";
import {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@te-inscreve/components";

import { TelaAviso } from "~/shared/ui/tela-aviso";

interface Props {
    entidades: readonly EntidadeOpcao[];
}

/**
 * Pedido de acesso a uma entidade, para a conta que ainda não tem vínculo.
 *
 * A lista é real — vem de `/entidades`. **O envio ainda não é**: o backend não
 * tem recurso de solicitação (nem model, nem rota), então o botão só troca o
 * estado desta tela. Nada sai daqui, e o texto de confirmação diz isso em vez
 * de prometer que alguém foi avisado.
 *
 * Quando a rota existir, o que muda é só o `enviar`: vira uma mutation do tRPC
 * e o estado de sucesso passa a ser o retorno dela.
 */
export function FormularioSolicitarAcesso({ entidades }: Props) {
    const [entidadeId, setEntidadeId] = useState("");
    const [enviado, setEnviado] = useState(false);

    const escolhida = entidades.find((e) => String(e.id) === entidadeId);

    if (enviado && escolhida) {
        return (
            <TelaAviso
                icone={
                    <CheckCircleIcon
                        aria-hidden="true"
                        className="text-muted-foreground"
                        size={48}
                        weight="duotone"
                    />
                }
                titulo="Solicitação registrada"
            >
                <p className="text-muted-foreground max-w-sm text-sm">
                    Você escolheu <strong>{escolhida.nome}</strong>. O envio de
                    solicitações ainda não está ligado à API — por enquanto isto
                    só demonstra a tela, e ninguém foi notificado.
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnviado(false)}
                >
                    Escolher outra
                </Button>
            </TelaAviso>
        );
    }

    return (
        <TelaAviso
            icone={
                <BuildingsIcon
                    aria-hidden="true"
                    className="text-muted-foreground"
                    size={48}
                    weight="duotone"
                />
            }
            titulo="Nenhuma entidade vinculada"
        >
            <p className="text-muted-foreground max-w-sm text-sm">
                Escolha a entidade de que você faz parte para pedir acesso ao
                painel.
            </p>

            <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
                <Select value={entidadeId} onValueChange={setEntidadeId}>
                    <SelectTrigger
                        id="entidade"
                        aria-label="Entidade"
                        className="bg-card w-full"
                    >
                        <SelectValue placeholder="Selecionar entidade" />
                    </SelectTrigger>
                    <SelectContent>
                        {entidades.map((entidade) => (
                            <SelectItem
                                key={entidade.id}
                                value={String(entidade.id)}
                            >
                                {entidade.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button disabled={!escolhida} onClick={() => setEnviado(true)}>
                    Solicitar acesso
                </Button>
            </div>
        </TelaAviso>
    );
}
