"use client";

import { useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";

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
}

export function FormCategoria({ eventoId, modalidadeId }: Props) {
    const router = useRouter();
    const { form, salvamento, salvar, erro } = useFormCategoria({
        eventoId,
        modalidadeId,
        onSuccess: () => {
            // Volta já com a aba da modalidade aberta, que é onde a categoria
            // recém-criada aparece.
            router.push(
                `/admin/eventos/${eventoId}?modalidade=${modalidadeId}`,
            );
            router.refresh();
        },
    });

    const salvando = salvamento === "loading";
    const voltarPara = `/admin/eventos/${eventoId}?modalidade=${modalidadeId}`;

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(salvar)}>
                <div className="bg-card sticky top-0 z-20 border-b">
                    <header className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-4 py-4 md:px-6">
                        <nav aria-label="Voltar">
                            <GoBackButton href={voltarPara} />
                        </nav>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    Criar categoria
                                </h1>
                                <p className="text-muted-foreground my-1.5 text-sm">
                                    A categoria entra na modalidade e passa a
                                    receber inscrições.
                                </p>
                            </div>

                            <Button type="submit" size="lg" disabled={salvando}>
                                {salvando && (
                                    <CircleNotchIcon
                                        aria-hidden="true"
                                        className="animate-spin"
                                    />
                                )}
                                {salvando ? "Salvando…" : "Salvar categoria"}
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

                        <CardContent className="flex flex-col gap-4">
                            <CampoTexto<CategoriaFormValues>
                                name="nome"
                                label="Nome da categoria"
                                placeholder="Ex.: Juvenil feminino"
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <CampoNumero<CategoriaFormValues>
                                    name="idadeMinima"
                                    label="Idade mínima"
                                    placeholder="Ex.: 12"
                                />
                                <CampoNumero<CategoriaFormValues>
                                    name="idadeMaxima"
                                    label="Idade máxima"
                                    placeholder="Ex.: 17"
                                />
                                <CampoNumero<CategoriaFormValues>
                                    name="maxInscricoes"
                                    label="Limite de inscrições"
                                    opcional
                                    min={1}
                                    placeholder="Sem limite"
                                    ajuda="Deixe vazio para não limitar as inscrições."
                                />
                            </div>
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
