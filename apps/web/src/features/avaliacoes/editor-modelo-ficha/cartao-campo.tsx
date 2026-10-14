import type { ReactNode } from "react";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import { Badge } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { CampoExibido } from "./lib/campo-exibido";
import { ROTULO_MODIFICADOR, ROTULO_TIPO } from "./lib/campo-exibido";
import { MiniaturaCampo } from "./miniatura-campo";

/**
 * O cartão de um campo: a miniatura do controle, o nome e o tipo. É o mesmo
 * no catálogo e na ficha em edição — o campo que se arrasta de um lado é o
 * que aparece do outro.
 *
 * O canto de cima leva uma doca encaixada na borda do cartão: o cadeado marca
 * o campo global, que não se altera; o lápis, o exclusivo, que se edita no
 * painel de propriedades. A doca herda a cor da borda, então acompanha o
 * hover, a seleção e o erro. Na ficha em edição, `icone` troca o lápis pelo
 * botão de editar, e `acoes` desliza para fora da doca com o ponteiro ou o
 * foco do teclado — a doca cresce para a esquerda em vez de outra barra
 * aparecer por cima.
 * No numérico, o selo diz se a nota soma ou subtrai, que é o que muda o
 * resultado.
 */
export function CartaoCampo({
    campo,
    global,
    icone,
    acoes,
    className,
    children,
}: {
    campo: CampoExibido;
    global: boolean;
    /** Substitui o ícone de estado da doca — o botão de editar na ficha. */
    icone?: ReactNode;
    /** Ações reveladas na doca com o ponteiro ou o foco. */
    acoes?: ReactNode;
    className?: string;
    /** O que mais o cartão leva — o aviso de erro da ficha em edição. */
    children?: ReactNode;
}) {
    const Icone = global ? LockSimpleIcon : PencilSimpleIcon;

    return (
        <div
            className={cn(
                "group/cartao bg-card hover:border-primary/50 relative flex h-full flex-col gap-2 rounded-md border p-2 shadow-xs transition-colors",
                className,
            )}
        >
            <MiniaturaCampo campo={campo} />
            <div className="bg-card absolute top-0 right-0 flex items-center rounded-tr-[calc(var(--radius-md)-1px)] rounded-bl-md border-b border-l border-inherit p-0.5 transition-colors">
                {acoes && (
                    <div className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 ease-out group-focus-within/cartao:grid-cols-[1fr] group-hover/cartao:grid-cols-[1fr]">
                        <div className="flex min-w-0 gap-0.5 overflow-hidden">
                            {acoes}
                        </div>
                    </div>
                )}
                {icone ?? (
                    <span
                        aria-hidden="true"
                        className="text-muted-foreground flex size-6 items-center justify-center"
                    >
                        <Icone className="size-3" />
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-2 text-xs leading-tight font-semibold">
                    {campo.nome}
                </span>
                <span className="text-muted-foreground mt-auto flex flex-wrap items-center gap-1 text-[11px]">
                    {ROTULO_TIPO[campo.tipo]}
                    {campo.modificadorNota && (
                        <Badge
                            variant={
                                campo.modificadorNota === "DESCONTA"
                                    ? "destructive"
                                    : "default"
                            }
                            className="ml-auto px-1.5 py-0 text-[10px]"
                        >
                            {ROTULO_MODIFICADOR[campo.modificadorNota]}
                        </Badge>
                    )}
                </span>
            </div>
            {children}
        </div>
    );
}
