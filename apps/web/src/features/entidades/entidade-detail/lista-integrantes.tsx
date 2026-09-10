import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr/UserPlus";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge, Button } from "@te-inscreve/components";

import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    idadeEm,
    matriculaVencida,
    nomeCompleto,
} from "~/features/entidades/shared/integrantes";
import { AvatarUsuario } from "~/features/usuarios/components/avatar-usuario";

interface Props {
    /** Só as primeiras pessoas — o painel resume, não lista tudo. */
    integrantes: Integrante[];
    /** Quantas a entidade tem ao todo, para o rodapé dizer o que ficou de fora. */
    total: number;
}

/**
 * Quem faz parte da entidade.
 *
 * Lista, e não tabela: cada pessoa tem identidade e poucas informações
 * relevantes, e a tarefa aqui é reconhecer alguém — não comparar colunas.
 *
 * Cada linha carrega o que decide uma inscrição: a idade define a categoria e
 * a matrícula vencida trava o envio, então as duas aparecem já aqui, sem
 * precisar abrir a tela de integrantes.
 */
export function ListaIntegrantes({ integrantes, total }: Props) {
    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground bg-card flex h-full flex-col items-center justify-center rounded-xl border border-dashed p-6 text-sm">
                Nenhum integrante cadastrado.
                {/* O `?novo` leva a tela de integrantes a abrir o cadastro
                    sozinha: quem clicou aqui já disse o que queria fazer, e
                    seria estranho largá-lo diante de outra lista vazia. */}
                <Button variant="link" asChild>
                    <Link href="/admin/minha-entidade/integrantes?novo=1">
                        <UserPlusIcon aria-hidden="true" weight="bold" />
                        Cadastrar
                    </Link>
                </Button>
            </p>
        );
    }

    return (
        <div className="bg-card divide-y overflow-hidden rounded-xl border">
            <ul className="divide-y">
                {integrantes.map((integrante) => {
                    const vencida = matriculaVencida(integrante);

                    return (
                        <li
                            key={integrante.id}
                            className="flex flex-wrap items-center gap-3 p-3"
                        >
                            <AvatarUsuario
                                nome={nomeCompleto(integrante)}
                                size={36}
                                alt=""
                            />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {nomeCompleto(integrante)}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                    {integrante.matriculaMtg} ·{" "}
                                    {idadeEm(integrante.dataNascimento)} anos
                                </p>
                            </div>

                            <Badge
                                variant="outline"
                                className={
                                    vencida
                                        ? "border-warning/40 bg-warning/10 shrink-0 gap-1"
                                        : "shrink-0 gap-1"
                                }
                            >
                                {vencida ? (
                                    <WarningIcon
                                        aria-hidden="true"
                                        weight="fill"
                                        className="text-warning"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="bg-primary size-1.5 rounded-full"
                                    />
                                )}
                                {vencida ? "Vencida" : "Ativa"}
                            </Badge>
                        </li>
                    );
                })}
            </ul>

            {/* O rodapé fecha a conta: diz o que está à vista e leva ao resto,
                que é onde se cadastra, filtra e rola. */}
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <span>
                    {total > integrantes.length
                        ? `Mostrando ${integrantes.length} de ${total}`
                        : `Mostrando ${total === 1 ? "o único" : `todos os ${total}`}`}
                </span>
                <Link
                    href="/admin/minha-entidade/integrantes"
                    className="hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                >
                    Ver mais
                    <ArrowRightIcon aria-hidden="true" className="size-3" />
                </Link>
            </div>
        </div>
    );
}
