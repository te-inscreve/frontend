"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { LayoutGroup, motion, MotionConfig } from "motion/react";

import { Button, cn, EXPANSION_TRANSITION } from "@te-inscreve/components";

import type { ItemPreenchido } from "./lib/ficha-preenchida";
import { FolhaAvaliacao } from "./folha-avaliacao";
import { formatarDataEnvio, formatarNota } from "./lib/avaliacoes-da-inscricao";
import { PranchetaAnimada } from "./prancheta-animada";

/** Uma ficha preenchida, pronta para a bancada: o servidor já casou tudo. */
export interface FichaDaBancada {
    id: number;
    /** A posição na ordem de envio: "Avaliação 2". */
    numero: number;
    /** Quem avaliou, ou nulo quando o cadastro não tem nome. */
    avaliador: string | null;
    nota: string;
    dataEnvio: string;
    modelo: { nome: string; versao: number };
    itens: ItemPreenchido[];
}

/**
 * As fichas de uma inscrição sobre a mesma mesa: lado a lado, cada uma é uma
 * prancheta com a nota e o resumo do que foi preenchido. Escolhida uma, ela
 * cresce até virar a folha inteira, e as outras viram abas no topo para pular
 * de uma para outra; "Todas as fichas" (ou `Esc`) a devolve ao lugar dela.
 *
 * Tudo sem mudar de rota: é estado local, e o morph é o shared layout do
 * Motion — a mesma técnica do `ExpandableDialog`, sem o diálogo, porque aqui
 * a folha substitui a grade em vez de flutuar sobre ela. Ver
 * `docs/animacoes.md`.
 *
 * O admin rola numa `div`, e não na janela, e o Motion mede em coordenadas da
 * viewport. Por isso a rolagem até o topo da bancada acontece antes da troca
 * de estado, no mesmo evento: a medição do cartão já sai na posição em que a
 * folha vai nascer, e nenhuma rolagem acontece no meio da animação.
 */
export function BancadaFichas({
    fichas,
    categoria,
}: {
    fichas: FichaDaBancada[];
    /** Modalidade e categoria, para o pé de cada folha. */
    categoria: string | null;
}) {
    const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
    // Até a primeira escolha, nada entra esmaecido: é o HTML do servidor.
    const [interagiu, setInteragiu] = useState(false);
    const topoRef = useRef<HTMLDivElement>(null);
    const devolverFocoA = useRef<number | null>(null);

    const selecionada = fichas.find(({ id }) => id === selecionadaId) ?? null;

    const abrir = (id: number) => {
        topoRef.current?.scrollIntoView({ block: "nearest" });
        setInteragiu(true);
        setSelecionadaId(id);
    };

    const voltar = () => {
        devolverFocoA.current = selecionadaId;
        topoRef.current?.scrollIntoView({ block: "nearest" });
        setSelecionadaId(null);
    };

    // Aberta, o foco vai para o título da folha; de volta, para o cartão de
    // onde ela saiu.
    useEffect(() => {
        if (selecionadaId !== null) {
            document
                .getElementById("titulo-avaliacao")
                ?.focus({ preventScroll: true });
            return;
        }
        if (devolverFocoA.current === null) return;
        document
            .getElementById(idDoCartao(devolverFocoA.current))
            ?.focus({ preventScroll: true });
        devolverFocoA.current = null;
    }, [selecionadaId]);

    useEffect(() => {
        if (selecionadaId === null) return;
        const aoTeclar = (evento: KeyboardEvent) => {
            if (evento.key !== "Escape" || evento.defaultPrevented) return;
            devolverFocoA.current = selecionadaId;
            setSelecionadaId(null);
        };
        document.addEventListener("keydown", aoTeclar);
        return () => document.removeEventListener("keydown", aoTeclar);
    }, [selecionadaId]);

    return (
        <MotionConfig reducedMotion="user" transition={EXPANSION_TRANSITION}>
            <LayoutGroup>
                <div ref={topoRef} className="scroll-mt-4">
                    {selecionada ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={voltar}
                                    className="transition-colors"
                                >
                                    <ArrowLeftIcon aria-hidden="true" />
                                    Todas as fichas
                                </Button>
                                {fichas.length > 1 && (
                                    <AbasFichas
                                        fichas={fichas}
                                        selecionadaId={selecionada.id}
                                        onSelecionar={setSelecionadaId}
                                    />
                                )}
                            </div>

                            <FolhaAvaliacao
                                // A chave troca a folha inteira ao pular de
                                // aba: a nova entra esmaecida, sem morph.
                                key={selecionada.id}
                                fichaId={selecionada.id}
                                itens={selecionada.itens}
                                cabecalho={
                                    <CabecalhoFolha ficha={selecionada} />
                                }
                                fechamento={
                                    <FechamentoFolha
                                        ficha={selecionada}
                                        categoria={categoria}
                                    />
                                }
                                rodape={<RodapeModelo ficha={selecionada} />}
                            />
                        </div>
                    ) : (
                        <ul
                            aria-label="Fichas avaliativas"
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {fichas.map((ficha) => (
                                <li key={ficha.id} className="group pt-2.5">
                                    <CartaoFicha
                                        ficha={ficha}
                                        entrar={interagiu}
                                        onAbrir={() => abrir(ficha.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </LayoutGroup>
        </MotionConfig>
    );
}

const idDoCartao = (fichaId: number) => `cartao-ficha-${fichaId}`;

/** Quem avaliou; sem nome no cadastro, o número da ficha. */
const rotulo = (ficha: FichaDaBancada) =>
    ficha.avaliador ?? `Avaliação ${ficha.numero}`;

/** Para o leitor de tela: "avaliação 2, de Maria Souza". */
const rotuloLongo = (ficha: FichaDaBancada) =>
    ficha.avaliador
        ? `avaliação ${ficha.numero}, de ${ficha.avaliador}`
        : `avaliação ${ficha.numero}`;

/**
 * As outras fichas, a um clique. O destaque da aba atual desliza entre elas
 * (`layoutId` próprio), para a troca ler como movimento e não como corte.
 */
function AbasFichas({
    fichas,
    selecionadaId,
    onSelecionar,
}: {
    fichas: FichaDaBancada[];
    selecionadaId: number;
    onSelecionar: (id: number) => void;
}) {
    return (
        <nav
            aria-label="Trocar de ficha"
            className="bg-card flex flex-wrap gap-1 rounded-full border p-1"
        >
            {fichas.map((ficha) => {
                const atual = ficha.id === selecionadaId;
                return (
                    <button
                        key={ficha.id}
                        type="button"
                        aria-current={atual ? "true" : undefined}
                        onClick={() => onSelecionar(ficha.id)}
                        className={cn(
                            "focus-visible:ring-ring/50 relative flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px]",
                            atual
                                ? "text-primary-foreground"
                                : "hover:bg-accent",
                        )}
                    >
                        {atual && (
                            <motion.span
                                layoutId="aba-ficha-atual"
                                aria-hidden="true"
                                style={{ borderRadius: 9999 }}
                                className="bg-primary absolute inset-0"
                            />
                        )}
                        <span className="relative">{rotulo(ficha)}</span>
                        <span
                            className={cn(
                                "relative tabular-nums",
                                !atual && "text-muted-foreground",
                            )}
                        >
                            {formatarNota(ficha.nota)}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

/**
 * Uma ficha fechada: a prancheta com a nota, a data e o resumo do que foi
 * dado — os totais de cada ocorrência e as notas dos campos gerais —, para
 * comparar as avaliações de relance antes de abrir uma.
 *
 * O alvo do clique é um botão esticado por cima da prancheta, e não um botão
 * em volta: `button` só aceita conteúdo de frase, e a folha tem listas.
 */
function CartaoFicha({
    ficha,
    entrar,
    onAbrir,
}: {
    ficha: FichaDaBancada;
    entrar: boolean;
    onAbrir: () => void;
}) {
    return (
        <PranchetaAnimada
            fichaId={ficha.id}
            entrar={entrar}
            className="group-hover:border-primary/40 group-has-focus-visible:ring-ring/50 group-has-focus-visible:border-ring aspect-3/4 p-1.5 transition-colors group-has-focus-visible:ring-[3px]"
            folhaClassName="gap-3 p-3"
            rodape={<RodapeModelo ficha={ficha} />}
            sobreposicao={
                <button
                    id={idDoCartao(ficha.id)}
                    type="button"
                    onClick={onAbrir}
                    aria-label={`Inspecionar a ${rotuloLongo(ficha)}, nota ${formatarNota(ficha.nota)}`}
                    className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none"
                />
            }
        >
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        Avaliação {ficha.numero}
                    </p>
                    {ficha.avaliador && (
                        <p className="truncate text-sm font-semibold">
                            {ficha.avaliador}
                        </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                        <time dateTime={ficha.dataEnvio}>
                            {formatarDataEnvio(ficha.dataEnvio)}
                        </time>
                    </p>
                </div>
                <p className="text-primary text-2xl font-bold tabular-nums">
                    {formatarNota(ficha.nota)}
                </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden mask-b-from-[calc(100%-1rem)]">
                <ResumoFicha itens={ficha.itens} />
            </div>
        </PranchetaAnimada>
    );
}

/**
 * O que dá para comparar numa ficha fechada: cada agrupamento com o total de
 * cada ocorrência, e os campos gerais com nota. Texto livre e alternativas
 * ficam para a folha aberta.
 */
function ResumoFicha({ itens }: { itens: ItemPreenchido[] }) {
    return itens.map((item) => {
        if (item.tipo === "agrupamento") {
            if (!item.temTotal) return null;
            return (
                <div key={`a${item.chave}`} className="flex flex-col gap-1">
                    <p className="bg-primary text-primary-foreground truncate rounded-[3px] px-2 py-0.5 text-[11px] font-semibold">
                        {item.nome}
                    </p>
                    <ul className="flex flex-col">
                        {item.ocorrencias.map((ocorrencia) => (
                            <li
                                key={ocorrencia.ordem}
                                className="flex items-end gap-2 text-xs"
                            >
                                <span className="min-w-0 truncate">
                                    {ocorrencia.nome}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="border-foreground/15 mb-1 min-w-2 flex-1 border-b border-dotted"
                                />
                                <span className="font-semibold tabular-nums">
                                    {ocorrencia.total ?? "—"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        if (item.valor.tipo !== "numerico") return null;
        return (
            <p key={`g${item.chave}`} className="flex items-end gap-2 text-xs">
                <span className="min-w-0 truncate">{item.campo.nome}</span>
                <span
                    aria-hidden="true"
                    className="border-foreground/15 mb-1 min-w-2 flex-1 border-b border-dotted"
                />
                <span
                    className={cn(
                        "font-semibold tabular-nums",
                        item.campo.modificadorNota === "DESCONTA" &&
                            "text-destructive",
                    )}
                >
                    {item.campo.modificadorNota === "DESCONTA" && "−"}
                    {item.valor.valor}
                </span>
            </p>
        );
    });
}

/** O topo da folha aberta. O título recebe o foco quando ela abre. */
function CabecalhoFolha({ ficha }: { ficha: FichaDaBancada }) {
    return (
        <header className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="mr-auto min-w-0">
                {ficha.avaliador && (
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        Avaliação {ficha.numero}
                    </p>
                )}
                <h2
                    id="titulo-avaliacao"
                    tabIndex={-1}
                    className="text-2xl leading-tight font-bold tracking-tight break-words outline-none md:text-3xl"
                >
                    {rotulo(ficha)}
                </h2>
                <p className="text-muted-foreground text-sm">
                    Enviada em{" "}
                    <time dateTime={ficha.dataEnvio}>
                        {formatarDataEnvio(ficha.dataEnvio)}
                    </time>
                </p>
            </div>
            <p className="flex flex-col items-end">
                <span className="text-muted-foreground text-xs">
                    Nota da avaliação
                </span>
                <span className="text-primary text-3xl font-bold tabular-nums">
                    {formatarNota(ficha.nota)}
                </span>
            </p>
        </header>
    );
}

/**
 * O pé da folha, como o espaço de assinatura de uma ficha de papel: quem
 * avaliou e em que categoria. Sem nome nenhum do avaliador, a linha fica de
 * fora — o número da ficha já está no título.
 */
function FechamentoFolha({
    ficha,
    categoria,
}: {
    ficha: FichaDaBancada;
    categoria: string | null;
}) {
    if (!ficha.avaliador && !categoria) return null;

    return (
        <dl className="border-foreground/15 mt-auto flex flex-col gap-1.5 border-t border-dashed pt-5 text-sm">
            {ficha.avaliador && (
                <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted-foreground">Avaliado por:</dt>
                    <dd className="font-semibold">{ficha.avaliador}</dd>
                </div>
            )}
            {categoria && (
                <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted-foreground">Categoria:</dt>
                    <dd className="font-semibold">{categoria}</dd>
                </div>
            )}
        </dl>
    );
}

function RodapeModelo({ ficha }: { ficha: FichaDaBancada }) {
    return (
        <>
            <span className="truncate">{ficha.modelo.nome}</span>
            <span className="ml-auto shrink-0 tabular-nums">
                <span className="sr-only">Versão </span>v{ficha.modelo.versao}
            </span>
        </>
    );
}
