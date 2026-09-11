"use client";

import Link from "next/link";
import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr/UserPlus";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { motion } from "motion/react";

import { Button } from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "~/features/entidades/integrantes/filtros-integrantes";
import type { AoEditarIntegrante } from "~/features/entidades/integrantes/modal-integrante";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { BarraFiltros } from "~/features/entidades/integrantes/barra-filtros";
import { CartaoIntegrante } from "~/features/entidades/integrantes/cartao-integrante";
import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { temFiltroAtivo } from "~/features/entidades/integrantes/filtros-integrantes";
import { CartaoIntegranteSelecao } from "./cartao-integrante-selecao";
import { contagemIntegrantes } from "./grupo";

/** Quantos esqueletos enquanto a primeira página não chega: uma coluna cheia. */
const ESQUELETOS = 5;

/** Onde o cadastro de integrante acontece — esta tela só aponta para lá. */
const CADASTRO_DE_INTEGRANTE = "/admin/minha-entidade/integrantes?novo";

interface Props extends AoEditarIntegrante {
    integrantes: Integrante[];
    total: number;
    carregando: boolean;
    erro: { message: string } | null;
    isFetchingNextPage: boolean;
    /** A sentinela do fim da lista liga aqui; ver {@link useVerticalScroll}. */
    sentinelaRef: React.Ref<HTMLDivElement>;
    filtros: FiltrosIntegrantes;
    onFiltrosChange: (filtros: FiltrosIntegrantes) => void;
    /**
     * O grupo aberto, quando há um. É ele que põe a coluna em modo de seleção:
     * sem grupo aberto, o cartão abre o detalhe da pessoa; com grupo aberto, o
     * cartão inclui a pessoa nele.
     */
    grupoAberto: string | null;
    onAlternarIntegrante: (integrante: Integrante) => void;
    /** Manda para o grupo aberto todo mundo que a coluna está mostrando. */
    onIncluirTodos: () => void;
}

/**
 * A coluna de integrantes da entidade, à esquerda da tela de grupos.
 *
 * Ela é a mesma lista em dois modos. Sem grupo aberto é consulta: os cartões são
 * os da tela de integrantes ({@link CartaoIntegrante}), e clicar abre o detalhe
 * da pessoa. Com um grupo aberto ela vira o lado de fora da formação — clicar
 * inclui, e quem entrou some da coluna para aparecer no grupo.
 *
 * A coluna não muda quando um grupo abre: é de propósito que ela fique parada
 * enquanto a outra metade da tela troca de assunto. Quem monta grupo passa o
 * tempo todo olhando esta lista, e recarregá-la a cada grupo aberto custaria a
 * rolagem e a busca que a pessoa já tinha feito.
 *
 * A rolagem é da coluna, e não da página, para a lista de gente e o grupo aberto
 * andarem separados. O `layoutScroll` na caixa rolável é o que faz o cartão que
 * viaja até a formação sair do lugar certo mesmo com a coluna rolada — ver a
 * quinta armadilha de `docs/animacoes.md`.
 *
 * O cadastro de integrante não mora aqui: o botão do fim leva à tela de
 * integrantes já com o formulário aberto (`?novo`). É uma tarefa de outra tela,
 * e duplicar o formulário faria duas portas para o mesmo cadastro.
 */
export function ColunaIntegrantes({
    integrantes,
    total,
    carregando,
    erro,
    isFetchingNextPage,
    sentinelaRef,
    filtros,
    onFiltrosChange,
    grupoAberto,
    onAlternarIntegrante,
    onIncluirTodos,
    onEditar,
}: Props) {
    return (
        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-5rem)]">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold tracking-tight">
                    Integrantes
                </h2>
                <p className="text-muted-foreground text-xs">
                    {grupoAberto
                        ? `Clique em alguém para incluir no grupo ${grupoAberto}.`
                        : "Quem está cadastrado na entidade. Abra um grupo para montar a formação."}
                </p>
            </div>

            <BarraFiltros
                filtros={filtros}
                onChange={onFiltrosChange}
                resultados={integrantes.length}
                total={total}
            />

            {/* O atalho do recorte: filtrar já é escolher quem entra, e depois
                disso clicar um por um é refazer à mão o que o filtro fez. Só
                aparece com um grupo aberto e alguém na lista — sem isso não há
                para onde mandar ninguém. */}
            {grupoAberto && integrantes.length > 0 && (
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onIncluirTodos}
                    className="shrink-0"
                >
                    <UsersThreeIcon aria-hidden="true" />
                    Incluir {contagemIntegrantes(integrantes.length)} no grupo
                </Button>
            )}

            {/* `layoutScroll`: o Motion mede posições em coordenadas de tela e
                não sabe sozinho que este contêiner rolou. Sem o aviso, o cartão
                que viaja para a formação nasceria deslocado. */}
            <motion.div
                layoutScroll
                className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1"
            >
                <ConteudoDaColuna
                    integrantes={integrantes}
                    carregando={carregando}
                    erro={erro}
                    temFiltro={temFiltroAtivo(filtros)}
                    grupoAberto={grupoAberto}
                    onAlternarIntegrante={onAlternarIntegrante}
                    onEditar={onEditar}
                />

                {isFetchingNextPage && (
                    <ul className="mt-3 grid gap-3">
                        <CartaoIntegranteSkeleton />
                        <CartaoIntegranteSkeleton />
                    </ul>
                )}

                <div ref={sentinelaRef} aria-hidden="true" className="h-px" />
            </motion.div>

            <Button asChild variant="outline" className="shrink-0">
                <Link href={CADASTRO_DE_INTEGRANTE}>
                    <UserPlusIcon aria-hidden="true" />
                    Cadastrar integrante
                </Link>
            </Button>
        </aside>
    );
}

/**
 * Carregando, falhar, vazio e a lista — decididos num lugar só, como na
 * {@link ListaIntegrantes}, para a mensagem não depender do modo da coluna.
 */
function ConteudoDaColuna({
    integrantes,
    carregando,
    erro,
    temFiltro,
    grupoAberto,
    onAlternarIntegrante,
    onEditar,
}: Pick<
    Props,
    | "integrantes"
    | "carregando"
    | "erro"
    | "grupoAberto"
    | "onEditar"
    | "onAlternarIntegrante"
> & { temFiltro: boolean }) {
    if (carregando) {
        return (
            <ul className="grid gap-3">
                {Array.from({ length: ESQUELETOS }, (_, indice) => (
                    <CartaoIntegranteSkeleton key={indice} />
                ))}
            </ul>
        );
    }

    if (erro) {
        return (
            <p className="text-destructive flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
                <BugIcon aria-hidden="true" size={18} />
                {erro.message}
            </p>
        );
    }

    if (integrantes.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                {temFiltro
                    ? "Ninguém corresponde ao que você procurou."
                    : grupoAberto
                      ? `Todo mundo da entidade já está no grupo ${grupoAberto}.`
                      : "Nenhum integrante cadastrado. Cadastre as pessoas da entidade para montar os grupos."}
            </p>
        );
    }

    return (
        <ul className="grid gap-3">
            {integrantes.map((integrante) =>
                grupoAberto ? (
                    <CartaoIntegranteSelecao
                        key={integrante.id}
                        integrante={integrante}
                        estado="disponivel"
                        grupo={grupoAberto}
                        onAlternar={onAlternarIntegrante}
                    />
                ) : (
                    <CartaoIntegrante
                        key={integrante.id}
                        integrante={integrante}
                        onEditar={onEditar}
                    />
                ),
            )}
        </ul>
    );
}
