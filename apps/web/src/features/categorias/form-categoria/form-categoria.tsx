"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";

import type { Categoria } from "@te-inscreve/schemas";
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { CategoriaFormValues } from "./categoria-form-schema";
import { GoBackButton } from "~/shared/ui/back-btn";
import { CampoNumero } from "~/shared/ui/form/campo-numero";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import { useFormCategoria } from "./use-form-categoria";

interface Props {
    /** Evento e modalidade lidos da rota. */
    eventoId: number;
    modalidadeId: number;
    /** Categoria em edição. Ausente quando o formulário está criando. */
    categoria?: Categoria;
    /**
     * Trilha "evento › modalidade" da página. Chega pronta do Server Component
     * porque os nomes vêm do servidor — o formulário só conhece os ids.
     */
    trilha?: ReactNode;
}

export function FormCategoria({
    eventoId,
    modalidadeId,
    categoria,
    trilha,
}: Props) {
    const router = useRouter();
    const editando = categoria !== undefined;

    // Criando, o lugar de chegada é a aba da modalidade, onde a categoria nova
    // aparece; editando, é o detalhe dela mesma, de onde se veio.
    const voltarPara = editando
        ? `/admin/eventos/${eventoId}/categorias/${categoria.id}?modalidade=${modalidadeId}`
        : `/admin/eventos/${eventoId}?modalidade=${modalidadeId}`;

    const { form, salvamento, salvar, erro } = useFormCategoria({
        eventoId,
        modalidadeId,
        categoria,
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
                                    {editando
                                        ? "Editar categoria"
                                        : "Criar categoria"}
                                </h1>
                                <p className="text-muted-foreground my-1.5 text-sm">
                                    {editando
                                        ? "As alterações valem para as inscrições que ainda vão acontecer."
                                        : "A categoria entra na modalidade e passa a receber inscrições."}
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
                            <CardTitle>Dados da categoria</CardTitle>
                            <CardDescription>
                                Nome, faixa etária e limites de inscrição
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-4 sm:grid-cols-6">
                            <CampoTexto<CategoriaFormValues>
                                name="nome"
                                label="Nome da categoria"
                                placeholder="Ex.: Juvenil feminino"
                                className="col-span-4"
                            />
                            <CampoNumero<CategoriaFormValues>
                                name="maxInscricoes"
                                label="Limite de inscrições"
                                opcional
                                min={1}
                                placeholder="Sem limite"
                                className="col-span-2"
                            />

                            <CampoNumero<CategoriaFormValues>
                                name="idadeMinima"
                                label="Idade mínima"
                                placeholder="Ex.: 12"
                                className="col-span-3"
                            />
                            <CampoNumero<CategoriaFormValues>
                                name="idadeMaxima"
                                label="Idade máxima"
                                placeholder="Ex.: 17"
                                className="col-span-3"
                            />
                        </CardContent>
                    </Card>

                    {erro && (
                        <p role="alert" className="text-destructive text-sm">
                            Não foi possível salvar a categoria. Revise os dados
                            e tente novamente.
                        </p>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
