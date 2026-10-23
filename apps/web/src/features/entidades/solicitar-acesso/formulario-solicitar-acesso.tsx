"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
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

import { revalidarPerfil } from "~/shared/api/revalidar";
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
    const router = useRouter();
    const [entidadeId, setEntidadeId] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [atualizando, iniciarAtualizacao] = useTransition();

    const escolhida = entidades.find((e) => String(e.id) === entidadeId);

    /**
     * Relê o perfil sem esperar o cache vencer.
     *
     * Quem vincula a conta a uma entidade faz isso fora do app, então esta tela
     * não tem como saber que a espera acabou — e a leitura do perfil fica até
     * 60 segundos no Data Cache. Derrubar a tag antes do `refresh` é o que
     * garante que o servidor vá mesmo à API em vez de repintar a mesma
     * resposta; sem isso o botão pareceria quebrado.
     *
     * O `refresh` repinta os Server Components da rota, layouts inclusive: se o
     * vínculo chegou, o portão do segmento deixa passar e a sidebar ganha os
     * subitens no mesmo movimento. O estado desta tela sobrevive ao refresh,
     * então quem ainda não foi vinculado continua exatamente onde estava.
     */
    const atualizar = () => {
        iniciarAtualizacao(async () => {
            await revalidarPerfil();
            router.refresh();
        });
    };

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
                <p className="text-muted-foreground max-w-sm text-sm">
                    Se alguém já vinculou sua conta, atualize para buscar o
                    perfil de novo.
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={atualizar}
                        disabled={atualizando}
                    >
                        <ArrowsClockwiseIcon
                            aria-hidden="true"
                            className={atualizando ? "animate-spin" : undefined}
                            size={16}
                        />
                        {atualizando ? "Atualizando…" : "Atualizar"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEnviado(false)}
                        disabled={atualizando}
                    >
                        Escolher outra
                    </Button>
                </div>
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
