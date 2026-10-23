"use client";

import { useState } from "react";

import {
    ExpandableDialog,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTrigger,
} from "@te-inscreve/components";

import type { AoEditarIntegrante } from "./modal-integrante";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";
import {
    AvisoMatricula,
    ModalIntegrante,
    ResumoIntegrante,
} from "./modal-integrante";

/**
 * Uma pessoa como cartão, na visualização em grade.
 *
 * O cartão inteiro é o gatilho do detalhe e mostra só o que identifica alguém
 * de relance — avatar, nome e a linha de resumo. O resto está a um clique, e a
 * grade cabe mais gente na tela justamente por não repetir tudo.
 *
 * `transition-colors`, e não `transition-all`: o Motion reescreve o `transform`
 * a cada quadro do morph, e uma transição de CSS sobre a mesma propriedade
 * disputaria com ele. Ver `docs/animacoes.md`.
 *
 * O `id` diz `cartao` porque a linha da tabela usa outro: com o mesmo `id` nos
 * dois, trocar de visualização faria o Motion animar cada pessoa da posição no
 * cartão até a posição na linha, e os nomes cruzariam a tela por cima das
 * outras pessoas — a troca é um corte, não um morph.
 */
export function CartaoIntegrante({
    integrante,
    onEditar,
}: { integrante: Integrante } & AoEditarIntegrante) {
    const [aberto, setAberto] = useState(false);

    return (
        <li>
            <ExpandableDialog
                id={`cartao-integrante-${integrante.id}`}
                open={aberto}
                onOpenChange={setAberto}
            >
                <ExpandableDialogTrigger className="bg-card hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full items-center gap-3 border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none">
                    <ExpandableDialogIcon className="size-9 bg-transparent">
                        <AvatarUsuario
                            nome={nomeCompleto(integrante)}
                            size={36}
                            alt=""
                        />
                    </ExpandableDialogIcon>

                    <span className="min-w-0 flex-1">
                        <ExpandableDialogLabel className="block truncate text-sm font-semibold">
                            {nomeCompleto(integrante)}
                        </ExpandableDialogLabel>
                        <ResumoIntegrante integrante={integrante} />
                    </span>

                    <AvisoMatricula integrante={integrante} />
                </ExpandableDialogTrigger>

                <ModalIntegrante integrante={integrante} onEditar={onEditar} />
            </ExpandableDialog>
        </li>
    );
}
