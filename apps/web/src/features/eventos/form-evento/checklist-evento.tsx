"use client";

import { useEffect, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleDashedIcon } from "@phosphor-icons/react/dist/ssr/CircleDashed";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { useFormState, useWatch } from "react-hook-form";

import {
    Button,
    cn,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@te-inscreve/components";
import { useFormContext } from "@te-inscreve/components/components/field";

import type { EventoFormValues } from "./evento-form-schema";
import { FormEventoSaveIcon } from "./form-evento-save-icon";

/** Campos que o checklist observa — o resto do formulário não o interessa. */
type ChecklistValores = Pick<
    EventoFormValues,
    "nome" | "descricao" | "local" | "periodoEvento" | "periodoInscricoes"
>;

/**
 * Recalculado a cada tecla a partir do estado do formulário — sem chamar a
 * validação, para o organizador ver o que falta antes de tentar salvar.
 */
function pendencias(valores: ChecklistValores) {
    return [
        { label: "Nome do evento", pronto: valores.nome.trim().length > 0 },
        { label: "Descrição", pronto: valores.descricao.trim().length > 0 },
        { label: "Local", pronto: valores.local.trim().length > 0 },
        {
            label: "Datas do evento",
            pronto: Boolean(
                valores.periodoEvento.from && valores.periodoEvento.to,
            ),
        },
        {
            label: "Datas de inscrição",
            pronto: Boolean(
                valores.periodoInscricoes.from && valores.periodoInscricoes.to,
            ),
        },
    ];
}

/** Quanto tempo o cabeçalho fica em tom de erro depois de um envio inválido. */
const DURACAO_ALERTA = 1800;

interface Props {
    salvamento: "idle" | "loading" | "success";
}

/**
 * Resumo do que falta preencher, recolhido por padrão e colado ao botão de
 * salvar: o organizador só abre a lista quando quer o detalhe, e um envio
 * inválido abre o painel sozinho apontando o que ficou pendente.
 *
 * Lê o formulário pelo context do RHF e assina apenas os campos que usa, então
 * digitar aqui não re-renderiza a árvore inteira do formulário — só este card.
 */
export function ChecklistEvento({ salvamento }: Props) {
    const { control } = useFormContext<EventoFormValues>();
    const [nome, descricao, local, periodoEvento, periodoInscricoes] = useWatch(
        {
            control,
            name: [
                "nome",
                "descricao",
                "local",
                "periodoEvento",
                "periodoInscricoes",
            ],
        },
    );
    const { errors, submitCount } = useFormState({ control });

    const itens = pendencias({
        nome,
        descricao,
        local,
        periodoEvento,
        periodoInscricoes,
    });
    const preenchidos = itens.filter((item) => item.pronto).length;
    const pendentes = itens.length - preenchidos;
    const tudoPronto = pendentes === 0;

    const [aberto, setAberto] = useState(false);
    const [alerta, setAlerta] = useState(false);
    const [ultimoEnvio, setUltimoEnvio] = useState(submitCount);

    // O RHF publica `submitCount` e `errors` na mesma atualização, então dá
    // para reagir a um envio recusado durante a render — sem efeito e sem
    // depender de um estado defasado do formulário.
    if (submitCount !== ultimoEnvio) {
        setUltimoEnvio(submitCount);

        if (Object.keys(errors).length > 0) {
            setAberto(true);
            setAlerta(true);
        }
    }

    useEffect(() => {
        if (!alerta) return;

        const temporizador = setTimeout(() => setAlerta(false), DURACAO_ALERTA);
        return () => clearTimeout(temporizador);
    }, [alerta]);

    const titulo = alerta
        ? "Preencha os campos pendentes"
        : tudoPronto
          ? "Tudo pronto para salvar"
          : `${pendentes === 1 ? "Falta" : "Faltam"} ${pendentes} de ${itens.length} campos`;

    return (
        <Collapsible
            open={aberto}
            onOpenChange={setAberto}
            className={cn(
                "bg-card flex flex-col overflow-hidden rounded-lg border shadow-sm",
                alerta &&
                    "border-destructive animate-shake motion-reduce:animate-none",
            )}
        >
            <CollapsibleTrigger
                className={cn(
                    "group/gatilho focus-visible:ring-ring/50 flex w-full cursor-pointer items-center justify-between gap-2.5 px-3.5 py-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset",
                    alerta ? "bg-destructive/8" : "hover:bg-muted/50",
                )}
            >
                <span className="flex min-w-0 items-center gap-2">
                    {alerta ? (
                        <WarningCircleIcon
                            aria-hidden="true"
                            weight="fill"
                            size={17}
                            className="text-destructive shrink-0"
                        />
                    ) : tudoPronto ? (
                        <CheckCircleIcon
                            aria-hidden="true"
                            weight="fill"
                            size={17}
                            className="text-primary shrink-0"
                        />
                    ) : (
                        <ListChecksIcon
                            aria-hidden="true"
                            size={17}
                            className="text-foreground shrink-0"
                        />
                    )}

                    <span
                        aria-live="polite"
                        className={cn(
                            "truncate text-sm font-semibold",
                            alerta
                                ? "text-destructive"
                                : tudoPronto
                                  ? "text-primary"
                                  : "text-foreground",
                        )}
                    >
                        {titulo}
                    </span>
                </span>

                <CaretDownIcon
                    aria-hidden="true"
                    size={15}
                    className="text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]/gatilho:rotate-180"
                />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="border-t px-3.5 pt-2.5 pb-3.5">
                    <ul className="flex flex-col gap-0.5">
                        {itens.map((item) => (
                            <li
                                key={item.label}
                                className="flex items-center gap-2.5 py-1.5 text-sm"
                            >
                                {item.pronto ? (
                                    <CheckCircleIcon
                                        aria-hidden="true"
                                        weight="fill"
                                        size={16}
                                        className="text-primary shrink-0"
                                    />
                                ) : (
                                    <CircleDashedIcon
                                        aria-hidden="true"
                                        size={16}
                                        className="text-muted-foreground shrink-0"
                                    />
                                )}
                                <span
                                    className={cn(
                                        item.pronto &&
                                            "text-muted-foreground line-through",
                                    )}
                                >
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p className="text-muted-foreground mt-1.5 text-xs">
                        {preenchidos} de {itens.length} itens preenchidos
                    </p>
                </div>
            </CollapsibleContent>

            {/* Colado à base do card: continua sendo o submit do formulário, e
             * segue clicável com pendências — é o clique que abre a lista. */}
            <Button
                type="submit"
                disabled={salvamento === "loading"}
                className={cn(
                    "h-12 w-full rounded-none text-base",
                    !tudoPronto && "bg-primary/90",
                )}
            >
                <FormEventoSaveIcon
                    current={
                        salvamento === "idle"
                            ? "floppy-disk"
                            : salvamento === "loading"
                              ? "spinner-gap"
                              : "check"
                    }
                />
                Salvar
            </Button>
        </Collapsible>
    );
}
