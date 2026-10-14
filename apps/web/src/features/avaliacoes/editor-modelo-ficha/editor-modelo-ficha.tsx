"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { FieldErrors } from "react-hook-form";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SidebarSimpleIcon } from "@phosphor-icons/react/dist/ssr/SidebarSimple";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { get } from "react-hook-form";

import type { CampoFicha } from "@te-inscreve/schemas";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { ModeloFichaFormValues } from "./lib/modelo-ficha-form-schema";
import type { Recipiente } from "./use-composicao";
import { CanvasModeloFicha } from "./canvas-modelo-ficha";
import {
    CartaoCampoGlobal,
    CatalogoCamposGlobais,
} from "./catalogo-campos-globais";
import { EditorProvider } from "./editor-contexto";
import {
    anunciosArraste,
    dadosDe,
    deteccaoColisao,
    instrucoesLeitorTela,
} from "./lib/arraste";
import {
    camposExclusivos,
    novaPosicaoGlobal,
} from "./lib/modelo-ficha-form-schema";
import { PainelPropriedadesCampo } from "./painel-propriedades-campo";
import { PreviaModeloFicha } from "./previa-modelo-ficha";
import { useComposicao } from "./use-composicao";
import { useSalvarModeloFicha } from "./use-salvar-modelo-ficha";

const LISTA = "/admin/fichas-avaliativas";

type Modo = "edicao" | "previa";

/**
 * A tela de criar modelo de ficha: catálogo de campos globais à esquerda, a
 * ficha ao centro, as propriedades do campo exclusivo aberto à direita.
 *
 * A página não rola: cabeçalho e rodapé ficam parados, e cada painel rola por
 * dentro. Abaixo de `lg` o catálogo flutua sobre a ficha; o painel de
 * propriedades flutua abaixo de `2xl`, porque somado ao catálogo e à sidebar
 * do admin ele espremia a ficha numa coluna de poucas palavras.
 */
export function EditorModeloFicha({
    camposGlobais,
}: {
    camposGlobais: CampoFicha[];
}) {
    const router = useRouter();
    const { form, salvar, salvando, salvo, errosGerais } = useSalvarModeloFicha(
        { aoSalvar: () => router.push(LISTA) },
    );
    const composicao = useComposicao(form);
    const catalogo = useMemo(
        () => new Map(camposGlobais.map((campo) => [campo.id, campo])),
        [camposGlobais],
    );

    const [modo, setModo] = useState<Modo>("edicao");
    const [selecionado, setSelecionado] = useState<string | null>(null);
    const telaLarga = useTelaLarga();
    // `null` segue a largura da tela: aberto no desktop, fechado no celular,
    // onde o painel cobriria a ficha.
    const [escolhaCatalogo, setEscolhaCatalogo] = useState<boolean | null>(
        null,
    );
    const catalogoAberto = escolhaCatalogo ?? telaLarga;
    const [destinoSaida, setDestinoSaida] = useState<string | null>(null);
    const [campoArrastado, setCampoArrastado] = useState<CampoFicha | null>(
        null,
    );

    const editando = modo === "edicao";
    const sujo = form.formState.isDirty && !salvo;

    useEffect(() => {
        if (!sujo) return;
        const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
        window.addEventListener("beforeunload", avisar);
        return () => window.removeEventListener("beforeunload", avisar);
    }, [sujo]);

    useEffect(() => {
        if (!selecionado) return;
        // Menus e diálogos tratam o próprio Esc e marcam o evento; só o que
        // sobra fecha o painel.
        const fechar = (evento: KeyboardEvent) => {
            if (evento.key === "Escape" && !evento.defaultPrevented) {
                setSelecionado(null);
            }
        };
        document.addEventListener("keydown", fechar);
        return () => document.removeEventListener("keydown", fechar);
    }, [selecionado]);

    const sensores = useSensors(
        // A distância deixa o clique no cartão ser clique, e não arraste.
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function aoComecarArraste({ active }: DragStartEvent) {
        const dados = dadosDe(active.data);
        setCampoArrastado(
            dados?.tipo === "global"
                ? (catalogo.get(dados.campoId) ?? null)
                : null,
        );
    }

    function aoSoltar({ active, over }: DragEndEvent) {
        setCampoArrastado(null);
        const ativo = dadosDe(active.data);
        const alvo = dadosDe(over?.data);
        if (!over || !ativo || !alvo) return;

        if (ativo.tipo === "global") {
            if (alvo.tipo !== "posicao" && alvo.tipo !== "recipiente") return;
            const recipiente = recipienteDe(alvo.recipiente);
            const indice =
                alvo.tipo === "posicao"
                    ? composicao
                          .lerPosicoes(recipiente)
                          .findIndex((posicao) => posicao.chave === over.id)
                    : undefined;
            composicao.inserirPosicao(
                recipiente,
                novaPosicaoGlobal(ativo.campoId),
                indice,
            );
            return;
        }

        if (active.id === over.id) return;

        if (
            ativo.tipo === "posicao" &&
            alvo.tipo === "posicao" &&
            ativo.recipiente === alvo.recipiente
        ) {
            const recipiente = recipienteDe(ativo.recipiente);
            const chaves = composicao
                .lerPosicoes(recipiente)
                .map((posicao) => posicao.chave);
            composicao.moverPosicao(
                recipiente,
                chaves.indexOf(String(active.id)),
                chaves.indexOf(String(over.id)),
            );
            return;
        }

        if (ativo.tipo === "agrupamento" && alvo.tipo === "agrupamento") {
            const chaves = form
                .getValues("agrupamentos")
                .map((agrupamento) => agrupamento.chave);
            composicao.moverAgrupamento(
                chaves.indexOf(String(active.id)),
                chaves.indexOf(String(over.id)),
            );
        }
    }

    function aoInvalidar(errors: FieldErrors<ModeloFichaFormValues>) {
        // Erro em campo exclusivo só aparece no painel: abre o primeiro. Os
        // erros vêm do argumento — o `form.formState` aqui ainda é o do
        // último render, de antes desta validação.
        const comErro = camposExclusivos(form.getValues()).find((exclusivo) =>
            get(errors, exclusivo.caminho.join(".")),
        );
        setModo("edicao");
        if (comErro) setSelecionado(comErro.chave);
    }

    function sair(destino: string) {
        if (sujo) setDestinoSaida(destino);
        else router.push(destino);
    }

    return (
        <EditorProvider
            value={{
                camposGlobais: catalogo,
                composicao,
                selecionado,
                selecionar: setSelecionado,
            }}
        >
            <FormProvider {...form}>
                <form
                    noValidate
                    onSubmit={form.handleSubmit(salvar, aoInvalidar)}
                    className="flex h-full min-h-0 flex-col"
                >
                    <header className="bg-card flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
                        {editando && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={
                                    catalogoAberto
                                        ? "Fechar campos globais"
                                        : "Abrir campos globais"
                                }
                                aria-expanded={catalogoAberto}
                                aria-controls="catalogo-campos-globais"
                                onClick={() =>
                                    setEscolhaCatalogo(!catalogoAberto)
                                }
                            >
                                <SidebarSimpleIcon aria-hidden="true" />
                            </Button>
                        )}
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={LISTA}
                                            onClick={(evento) => {
                                                if (!sujo) return;
                                                evento.preventDefault();
                                                sair(LISTA);
                                            }}
                                        >
                                            Fichas avaliativas
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Novo modelo</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <Tabs
                            value={modo}
                            onValueChange={(valor) => setModo(valor as Modo)}
                            className="ml-auto"
                        >
                            <TabsList aria-label="Modo da ficha">
                                <TabsTrigger value="edicao" className="text-sm">
                                    Edição
                                </TabsTrigger>
                                <TabsTrigger value="previa" className="text-sm">
                                    Pré-visualização
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </header>

                    <DndContext
                        sensors={sensores}
                        collisionDetection={deteccaoColisao}
                        accessibility={{
                            announcements: anunciosArraste,
                            screenReaderInstructions: instrucoesLeitorTela,
                        }}
                        onDragStart={aoComecarArraste}
                        onDragEnd={aoSoltar}
                        onDragCancel={() => setCampoArrastado(null)}
                    >
                        <div className="relative flex min-h-0 flex-1">
                            {editando && catalogoAberto && (
                                <aside
                                    id="catalogo-campos-globais"
                                    className="bg-card w-72 shrink-0 overflow-y-auto border-r max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-20 max-lg:shadow-xl"
                                >
                                    <CatalogoCamposGlobais
                                        id="catalogo"
                                        campos={camposGlobais}
                                    />
                                </aside>
                            )}

                            <main
                                className="bg-muted/40 min-h-0 min-w-0 flex-1 overflow-y-auto"
                                onClick={(evento) => {
                                    // Menus e diálogos vivem num portal, mas
                                    // o clique deles sobe pela árvore do
                                    // React até aqui: só fecha o painel o
                                    // clique que caiu de fato na ficha.
                                    if (
                                        evento.currentTarget.contains(
                                            evento.target as Node,
                                        )
                                    ) {
                                        setSelecionado(null);
                                    }
                                }}
                            >
                                <div className="mx-auto w-full max-w-3xl px-4 py-8">
                                    <div className="bg-card rounded-lg border p-6 shadow-xs md:p-10">
                                        {editando ? (
                                            <CanvasModeloFicha />
                                        ) : (
                                            <PreviaModeloFicha />
                                        )}
                                    </div>
                                </div>
                            </main>

                            {editando && selecionado && (
                                <aside className="bg-card w-80 shrink-0 overflow-y-auto border-l max-2xl:absolute max-2xl:inset-y-0 max-2xl:right-0 max-2xl:z-20 max-2xl:shadow-xl">
                                    <PainelPropriedadesCampo />
                                </aside>
                            )}
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {campoArrastado && (
                                <CartaoCampoGlobal
                                    campo={campoArrastado}
                                    className="w-32 cursor-grabbing shadow-lg"
                                />
                            )}
                        </DragOverlay>
                    </DndContext>

                    <footer className="bg-card flex shrink-0 flex-wrap items-center gap-3 border-t px-4 py-3">
                        {errosGerais.length > 0 && (
                            <ul
                                role="alert"
                                className="text-destructive flex min-w-0 flex-1 flex-col text-sm"
                            >
                                {errosGerais.map((erro) => (
                                    <li key={erro}>{erro}</li>
                                ))}
                            </ul>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => sair(LISTA)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={salvando}>
                                {salvando && (
                                    <SpinnerGapIcon
                                        aria-hidden="true"
                                        className="animate-spin"
                                    />
                                )}
                                Criar modelo
                            </Button>
                        </div>
                    </footer>
                </form>
            </FormProvider>

            <AlertDialog
                open={destinoSaida !== null}
                onOpenChange={(aberto) => !aberto && setDestinoSaida(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Sair sem criar o modelo?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A ficha montada até aqui não foi salva e será
                            perdida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Continuar editando
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-white"
                            onClick={() => {
                                if (destinoSaida) router.push(destinoSaida);
                            }}
                        >
                            Descartar e sair
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EditorProvider>
    );
}

function recipienteDe(id: string): Recipiente {
    return id === "gerais" ? "gerais" : { agrupamento: id };
}

const TELA_LARGA = "(min-width: 1024px)";

/** O breakpoint `lg`, em que os painéis laterais cabem ao lado da ficha. */
function useTelaLarga() {
    return useSyncExternalStore(
        (aoMudar) => {
            const consulta = window.matchMedia(TELA_LARGA);
            consulta.addEventListener("change", aoMudar);
            return () => consulta.removeEventListener("change", aoMudar);
        },
        () => window.matchMedia(TELA_LARGA).matches,
        () => true,
    );
}
