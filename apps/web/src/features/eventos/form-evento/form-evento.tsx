"use client";

import { useRouter } from "next/navigation";
import { CalendarDotsIcon, FilesIcon, InfoIcon } from "@phosphor-icons/react";
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

import { FormEventoSaveIcon } from "~/features/eventos/form-evento/form-evento-save-icon";
import { GoBackButton } from "~/shared/ui/back-btn";
import { useObjectUrl } from "~/shared/utils/use-object-url";
import { ChecklistEvento } from "./checklist-evento";
import { CartazField } from "./fields/cartaz-field";
import { DescricaoField } from "./fields/descricao-field";
import { LocalField } from "./fields/local-field";
import { LogoField } from "./fields/logo-field";
import { NomeField } from "./fields/nome-field";
import { PeriodoEventoField } from "./fields/periodo-evento-field";
import { PeriodoInscricoesField } from "./fields/periodo-inscricoes-field";
import { RegulamentoField } from "./fields/regulamento-field";
import { UnicoField } from "./fields/unico-field";
import { PreviewEvento } from "./preview-evento";
import { useFormEvento } from "./use-form-evento";

export function FormEvento() {
    const router = useRouter();
    const { form, salvamento, salvar, erro } = useFormEvento({
        onSucess: () => {
            // router.push(`/admin/eventos/${evento.slug}`);
            router.push(`/admin/eventos/`);
            router.refresh();
        },
    });

    // A prévia e o checklist acompanham a digitação, então o formulário inteiro
    // re-renderiza a cada tecla — é o preço de ter o cartaz atualizando ao vivo.
    // O React Compiler avisa que não consegue memoizar `watch()`; aqui tanto
    // faz, já que o objetivo é justamente re-renderizar. A alternativa,
    // `useWatch`, devolve um tipo parcial e exigiria um cast.
    const valores = form.watch();
    const erros = form.formState.errors;
    const cartazUrl = useObjectUrl(valores.cartaz);

    const abaGeralInvalida = [
        erros.nome,
        erros.descricao,
        erros.local,
        erros.unico,
    ].some(Boolean);
    const abaDatasInvalida = [
        erros.periodoEvento,
        erros.periodoInscricoes,
    ].some(Boolean);
    const abaArquivosInvalida = [
        erros.logo,
        erros.cartaz,
        erros.regulamento,
    ].some(Boolean);
    const estiloAbaInvalida =
        "text-destructive data-[state=active]:text-destructive dark:data-[state=active]:text-destructive";

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(salvar)}>
                <div className="bg-card sticky top-0 z-20 border-b">
                    <header className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
                        <nav aria-label="Voltar">
                            <GoBackButton href="/admin/eventos" />
                        </nav>

                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Criar evento
                        </h1>
                        <p className="text-muted-foreground my-1.5 max-w-lg text-sm">
                            Preencha as informações abaixo. Você pode salvar
                            como rascunho e publicar quando estiver pronto.
                        </p>
                    </header>
                </div>

                <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <Tabs defaultValue="geral" className="min-w-0">
                        <TabsList className="grid w-full grid-cols-3 sm:w-80">
                            <TabsTrigger
                                value="geral"
                                aria-invalid={abaGeralInvalida}
                                className={
                                    abaGeralInvalida
                                        ? estiloAbaInvalida
                                        : undefined
                                }
                            >
                                <InfoIcon />
                                Geral
                                {abaGeralInvalida && (
                                    <WarningCircleIcon
                                        aria-hidden="true"
                                        weight="fill"
                                    />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="datas"
                                aria-invalid={abaDatasInvalida}
                                className={
                                    abaDatasInvalida
                                        ? estiloAbaInvalida
                                        : undefined
                                }
                            >
                                <CalendarDotsIcon />
                                Datas
                                {abaDatasInvalida && (
                                    <WarningCircleIcon
                                        aria-hidden="true"
                                        weight="fill"
                                    />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="arquivos"
                                aria-invalid={abaArquivosInvalida}
                                className={
                                    abaArquivosInvalida
                                        ? estiloAbaInvalida
                                        : undefined
                                }
                            >
                                <FilesIcon />
                                Arquivos
                                {abaArquivosInvalida && (
                                    <WarningCircleIcon
                                        aria-hidden="true"
                                        weight="fill"
                                    />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="geral"
                            className="mt-3 flex flex-col gap-5"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações básicas</CardTitle>
                                    <CardDescription>
                                        Nome, descrição e local do evento
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">
                                    <NomeField />
                                    <DescricaoField />
                                    <LocalField />
                                    <UnicoField />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent
                            value="datas"
                            className="mt-3 flex flex-col gap-5"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Períodos importantes</CardTitle>
                                    <CardDescription>
                                        Datas de início e término das inscrições
                                        e do evento
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">
                                    <PeriodoInscricoesField />
                                    <PeriodoEventoField />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent
                            value="arquivos"
                            className="mt-3 flex flex-col gap-5"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Arquivos</CardTitle>
                                    <CardDescription>
                                        Logo, cartaz e regulamento do evento
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-wrap gap-6">
                                    <LogoField />
                                    <CartazField />
                                    <RegulamentoField />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* `top-40` deixa a coluna parar logo abaixo da barra fixa,
                    que mede 141px a partir do breakpoint `lg`. */}
                    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-40">
                        <PreviewEvento
                            nome={valores.nome}
                            local={valores.local}
                            cartazUrl={cartazUrl}
                            periodoEvento={valores.periodoEvento}
                            periodoInscricoes={valores.periodoInscricoes}
                            publicado={valores.publicado}
                        />
                        <ChecklistEvento valores={valores} />
                        {erro && (
                            <p
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                Não foi possível salvar o evento. Revise os
                                dados e tente novamente.
                            </p>
                        )}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={salvamento === "loading"}
                        >
                            <FormEventoSaveIcon
                                current={
                                    salvamento === "idle"
                                        ? "floppy-disk"
                                        : salvamento === "loading"
                                          ? "spinner-gap"
                                          : "check"
                                }
                            />
                            Salvar
                        </Button>
                    </aside>
                </div>
            </form>
        </FormProvider>
    );
}
