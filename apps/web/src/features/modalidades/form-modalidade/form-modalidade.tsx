"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { ModalidadeFormValues } from "./modalidade-form-schema";
import { CamposModalidade } from "./campos-modalidade";
import { CategoriasField } from "./categorias/categorias-field";
import { useFormModalidade } from "./use-form-modalidade";

interface Props {
    /** Evento dono da modalidade, lido do `[slug]` da rota. */
    eventoId: number;
    /**
     * Trilha do evento, pronta do Server Component: o nome do evento vem do
     * servidor, e aqui só se conhece o id.
     */
    trilha?: ReactNode;
}

export function FormModalidade({ eventoId, trilha }: Props) {
    const router = useRouter();
    const { form, salvamento, salvar, erro } = useFormModalidade({
        eventoId,
        onSuccess: () => {
            router.push(`/admin/eventos/${eventoId}`);
            router.refresh();
        },
    });

    const salvando = salvamento === "loading";
    const erros = form.formState.errors;

    // Qualquer erro dentro do array é da aba de categorias, seja de um item ou
    // da lista inteira — basta a chave existir.
    const abaModalidadeInvalida = camposDaModalidade.some((campo) =>
        Boolean(erros[campo]),
    );
    const abaCategoriasInvalida = Boolean(erros.categorias);

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(salvar)}>
                <div className="bg-card sticky top-0 z-20 border-b">
                    <header className="mx-auto flex w-full max-w-4xl flex-col gap-1.5 px-4 py-4 md:px-6">
                        {/* <nav aria-label="Voltar">
                            <GoBackButton href={`/admin/eventos/${eventoId}`} />
                        </nav> */}

                        {trilha}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    Criar modalidade
                                </h1>
                                <p className="text-muted-foreground my-1.5 text-sm">
                                    Descreva a modalidade e cadastre as
                                    categorias que vão receber inscrições.
                                </p>
                            </div>

                            <Button type="submit" size="lg" disabled={salvando}>
                                {salvando ? (
                                    <CircleNotchIcon
                                        aria-hidden="true"
                                        className="animate-spin"
                                    />
                                ) : (
                                    <FloppyDiskIcon
                                        aria-hidden="true"
                                        weight="bold"
                                    />
                                )}
                                {salvando ? "Salvando…" : "Salvar"}
                            </Button>
                        </div>
                    </header>
                </div>

                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-4 md:px-6">
                    {/* As abas só escondem campos — o formulário continua sendo
                        um só, então a validação e o envio abrangem as duas. */}
                    <Tabs defaultValue="modalidade" className="w-full">
                        <TabsList
                            className="grid w-full grid-cols-2 sm:w-72"
                            variant="line"
                        >
                            <ModalidadeTabTrigger
                                value="modalidade"
                                icon={<InfoIcon />}
                                invalida={abaModalidadeInvalida}
                            >
                                Modalidade
                            </ModalidadeTabTrigger>
                            <ModalidadeTabTrigger
                                value="categorias"
                                icon={<StackIcon />}
                                invalida={abaCategoriasInvalida}
                            >
                                Categorias
                            </ModalidadeTabTrigger>
                        </TabsList>

                        <TabsContent value="modalidade" className="mt-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Informações da modalidade
                                    </CardTitle>
                                    <CardDescription>
                                        Nome, descrição e regras de premiação
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">
                                    <CamposModalidade />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="categorias" className="mt-2">
                            <p className="text-foreground bullet mb-4 text-sm">
                                As cadegorias servem para separar os inscritos
                                em grupos de idade.
                            </p>
                            <CategoriasField />
                        </TabsContent>
                    </Tabs>

                    {erro && (
                        <p role="alert" className="text-destructive text-sm">
                            Não foi possível salvar a modalidade. Revise os
                            dados e tente novamente.
                        </p>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}

/** Campos diretos da modalidade — o resto do formulário é o array aninhado. */
const camposDaModalidade = [
    "nome",
    "descricao",
    "planilhaAberta",
    "maxPosicaoPremiada",
    "isGrupo",
    "minInscritosPorGrupo",
    "maxInscritosPorGrupo",
    "maxInscricoesEntidadePorCategoria",
] as const satisfies readonly (keyof ModalidadeFormValues)[];

type AbaModalidade = "modalidade" | "categorias";

function ModalidadeTabTrigger({
    value,
    icon,
    invalida,
    children,
}: {
    value: AbaModalidade;
    icon: ReactNode;
    invalida: boolean;
    children: ReactNode;
}) {
    const descricaoErroId = `${value}-tab-error`;

    return (
        <TabsTrigger
            value={value}
            data-invalid={invalida}
            aria-describedby={invalida ? descricaoErroId : undefined}
            className={
                invalida
                    ? "text-destructive data-[state=active]:text-destructive dark:data-[state=active]:text-destructive"
                    : undefined
            }
        >
            {icon}
            {children}
            {invalida && (
                <>
                    <WarningCircleIcon aria-hidden="true" weight="fill" />
                    <span id={descricaoErroId} className="sr-only">
                        Esta aba contém erros
                    </span>
                </>
            )}
        </TabsTrigger>
    );
}
