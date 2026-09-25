"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { MinusCircleIcon } from "@phosphor-icons/react/dist/ssr/MinusCircle";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";

import { cn } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    AvisoMatricula,
    ResumoIntegrante,
} from "~/features/entidades/integrantes/modal-integrante";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

type Props = {
    integrante: Integrante;
    onAlternar: (integrante: Integrante) => void;
    className?: string;
} & (
    | {
          /** Na lista da entidade: o clique inclui, ou tira se já estiver. */
          lado: "lista";
          selecionado: boolean;
      }
    | {
          /** No ticket: o clique tira. */
          lado: "ticket";
      }
);

/**
 * Uma pessoa como cartão clicável, no modo de inscrever.
 *
 * Novo, e não o {@link CartaoIntegranteSelecao} da bancada de grupo: aquele
 * tem `layoutId` compartilhado entre as duas mãos e rótulos de grupo, e
 * aqui o cartão **permanece na lista** (marcado) enquanto uma cópia aparece
 * no ticket — dois elementos com o mesmo `layoutId` ao mesmo tempo fazem o
 * Motion animar um para cima do outro. Por isso não há `layoutId` nenhum: o
 * ticket anima a entrada e a saída das linhas com `AnimatePresence`, e a
 * lista só troca o sinal.
 *
 * Devolve o `button`, e não o `<li>`: o ticket embrulha num `motion.li` para
 * a linha crescer no lugar, e a lista, num `<li>` comum.
 *
 * `aria-pressed` só na lista, onde o cartão é um alternador. No ticket ele é
 * um botão de tirar, e o rótulo já diz isso. Na lista, marcado, o hover vira
 * vermelho: o próximo clique tira a pessoa, e o cartão avisa antes.
 */
export function CartaoIntegranteInscricao(props: Props) {
    const { integrante, onAlternar, className } = props;
    const nome = nomeCompleto(integrante);
    const marcado = props.lado === "ticket" || props.selecionado;

    return (
        <button
            type="button"
            onClick={() => onAlternar(integrante)}
            aria-pressed={
                props.lado === "lista" ? props.selecionado : undefined
            }
            aria-label={
                marcado
                    ? `Tirar ${nome} da inscrição`
                    : `Incluir ${nome} na inscrição`
            }
            className={cn(
                "focus-visible:ring-ring/50 group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                // Três estados, duas cores: verde para quem vai entrar,
                // vermelho no hover de quem vai sair. Marcado na lista é o
                // único que já nasce tingido — é a resposta ao clique.
                props.lado === "lista" && !props.selecionado
                    ? "bg-card border-border/70 hover:border-primary/50 hover:bg-primary/5"
                    : props.lado === "lista"
                      ? "border-primary bg-primary/5 hover:border-destructive/50 hover:bg-destructive/5"
                      : "bg-card border-border/70 hover:border-destructive/50 hover:bg-destructive/5",
                className,
            )}
        >
            <AvatarUsuario nome={nome} size={36} alt="" />

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                    {nome}
                </span>
                <ResumoIntegrante integrante={integrante} />
            </span>

            <AvisoMatricula integrante={integrante} />

            <Sinal lado={props.lado} marcado={marcado} />
        </button>
    );
}

/** O ícone do canto: o que o clique vai fazer. Fora da ordem de foco. */
function Sinal({ lado, marcado }: { lado: Props["lado"]; marcado: boolean }) {
    if (lado === "ticket") {
        return (
            <MinusCircleIcon
                aria-hidden="true"
                size={20}
                weight="bold"
                className="text-muted-foreground group-hover:text-destructive shrink-0 transition-colors"
            />
        );
    }

    return marcado ? (
        <CheckCircleIcon
            aria-hidden="true"
            size={20}
            weight="fill"
            className="text-primary group-hover:text-destructive shrink-0 transition-colors"
        />
    ) : (
        <PlusCircleIcon
            aria-hidden="true"
            size={20}
            weight="bold"
            className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
        />
    );
}
