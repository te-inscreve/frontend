"use client";

import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import type { FormIntegrante } from "@te-inscreve/schemas";
import {
    Badge,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogTitle,
} from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    formatarDataISO,
    idadeEm,
    matriculaVencida,
    nomeCompleto,
} from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";
import { DetalheIntegrante } from "./detalhe-integrante";

/**
 * O modal de uma pessoa, igual nas duas visualizações da listagem.
 *
 * Fica fora do cartão e da linha porque as duas expandem para o mesmo lugar:
 * duplicá-lo faria o cabeçalho divergir de um lado, e é justamente ele que
 * precisa casar com o gatilho para o morph não deformar.
 *
 * O cabeçalho repete o gatilho no mesmo tamanho — avatar 36, nome em `text-sm`,
 * mesmo `flex-1`. Elemento compartilhado que muda de tamanho é escalado pelo
 * Motion, e escala em texto é esticamento: quem cresce no morph é a caixa, não
 * as peças dela. Ver `docs/animacoes.md`. A folga à direita é do botão fechar.
 */
/** Quem edita recebe o id e o cadastro pronto para a API. */
export interface AoEditarIntegrante {
    onEditar: (id: number, dados: FormIntegrante) => Promise<void> | void;
}

export function ModalIntegrante({
    integrante,
    onEditar,
}: { integrante: Integrante } & AoEditarIntegrante) {
    return (
        <ExpandableDialogContent className="max-w-xl!">
            <ExpandableDialogHeader>
                <div className="flex items-center gap-3 pr-7">
                    <ExpandableDialogIcon className="size-9 bg-transparent">
                        <AvatarUsuario
                            nome={nomeCompleto(integrante)}
                            size={36}
                            alt=""
                        />
                    </ExpandableDialogIcon>

                    <span className="min-w-0 flex-1">
                        <ExpandableDialogTitle className="block truncate text-sm font-semibold">
                            {nomeCompleto(integrante)}
                        </ExpandableDialogTitle>
                        <ResumoIntegrante integrante={integrante} />
                    </span>

                    <AvisoMatricula integrante={integrante} />
                </div>
            </ExpandableDialogHeader>

            <ExpandableDialogBody>
                <DetalheIntegrante
                    integrante={integrante}
                    onEditar={onEditar}
                />
            </ExpandableDialogBody>
        </ExpandableDialogContent>
    );
}

/**
 * Matrícula e idade — o que decide se a pessoa pode ser inscrita.
 *
 * Tudo em `span`: o gatilho do modal é um `button`, e `button` só aceita
 * conteúdo de frase — `div` e `p` ali dentro seriam HTML inválido.
 */
export function ResumoIntegrante({ integrante }: { integrante: Integrante }) {
    return (
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="flex items-center gap-1">
                <IdentificationCardIcon aria-hidden="true" />
                {integrante.matriculaMtg}
            </span>
            {" · "}
            <span className="flex items-center gap-1">
                {idadeEm(integrante.dataNascimento)} anos
            </span>
        </span>
    );
}

/**
 * A validade só aparece quando é problema — vencida, ela trava a inscrição.
 *
 * Diz só que venceu: a data por extenso não cabe ao lado do nome nem no cartão
 * da grade nem no cabeçalho do modal em tela estreita, e empurra o nome para
 * uma coluna de uma palavra por linha. Ela fica no `title` e, por escrito, em
 * "Validade da matrícula" no corpo do detalhe.
 */
export function AvisoMatricula({ integrante }: { integrante: Integrante }) {
    if (!matriculaVencida(integrante)) return null;

    return (
        <span className="flex shrink-0 items-center gap-2">
            <Badge
                variant={"warning"}
                title={`Matrícula vencida em ${formatarDataISO(integrante.validade)}`}
            >
                <WarningIcon
                    aria-hidden="true"
                    weight="fill"
                    className="text-warning"
                />
                Vencida
            </Badge>
        </span>
    );
}

/**
 * Situação da matrícula como palavra, para a coluna da tabela.
 *
 * A tabela precisa de um valor em toda linha — coluna que só às vezes tem
 * conteúdo não se lê de cima para baixo —, então aqui "ativa" aparece também,
 * ao contrário do {@link AvisoMatricula}, que só fala quando há problema.
 */
export function SituacaoMatricula({ integrante }: { integrante: Integrante }) {
    const vencida = matriculaVencida(integrante);

    return (
        <Badge
            variant={vencida ? "warning" : "outline"}
            title={
                integrante.validade
                    ? `Válida até ${formatarDataISO(integrante.validade)}`
                    : "Validade da matrícula não informada"
            }
        >
            {vencida && (
                <WarningIcon
                    aria-hidden="true"
                    weight="fill"
                    className="text-warning"
                />
            )}
            {vencida ? "Vencida" : "Ativa"}
        </Badge>
    );
}
