"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";

import type { Modalidade } from "@te-inscreve/schemas";
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import { GoBackButton } from "~/shared/ui/back-btn";
import { CamposModalidade } from "./campos-modalidade";
import { useFormEdicaoModalidade } from "./use-form-modalidade";

interface Props {
    /** Evento dono da modalidade, lido do `[slug]` da rota. */
    eventoId: number;
    /** Modalidade em edição, com os valores atuais dos campos. */
    modalidade: Modalidade;
    /**
     * Trilha "evento › modalidade", pronta do Server Component: os nomes vêm
     * do servidor, e aqui só se conhecem os ids.
     */
    trilha?: ReactNode;
}

/**
 * Edição das regras de uma modalidade que já existe.
 *
 * Não é a mesma tela da criação: lá a modalidade nasce junto das categorias,
 * e aqui elas já existem — cada uma tem a própria tela, então esta página
 * mexe só nas regras da modalidade.
 */
export function FormEdicaoModalidade({ eventoId, modalidade, trilha }: Props) {
    const router = useRouter();

    // O lugar de chegada é a aba da modalidade no evento, de onde se veio.
    const voltarPara = `/admin/eventos/${eventoId}/modalidades/${modalidade.id}`;

    const { form, salvamento, salvar, erro } = useFormEdicaoModalidade({
        eventoId,
        modalidade,
        onSuccess: () => {
            router.push(voltarPara);
            router.refresh();
        },
    });

    const salvando = salvamento === "loading";

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(salvar)}>
                <div className="bg-card sticky top-0 z-20 border-b">
                    <header className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-4 py-4 md:px-6">
                        <nav aria-label="Voltar">
                            <GoBackButton href={voltarPara} />
                        </nav>

                        {trilha}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    Editar modalidade
                                </h1>
                                <p className="text-muted-foreground my-1.5 text-sm">
                                    As alterações valem para as inscrições que
                                    ainda vão acontecer.
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

                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da modalidade</CardTitle>
                            <CardDescription>
                                Nome, descrição e regras de premiação
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-4">
                            <CamposModalidade />
                        </CardContent>
                    </Card>

                    <p className="text-muted-foreground text-sm">
                        {/* Uma modalidade sem categoria não recebe inscrição:
                            quem chega aqui procurando por elas precisa saber
                            que a edição delas é outra tela. */}
                        As categorias desta modalidade são editadas cada uma na
                        própria tela, pela aba da modalidade no evento.
                    </p>

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
