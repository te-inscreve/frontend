"use client";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CalendarDotsIcon, FilesIcon, InfoIcon } from "@phosphor-icons/react";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";

import type { Evento } from "@te-inscreve/schemas";
import {
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

import type { EventoFormValues } from "./evento-form-schema";
import { GoBackButton } from "~/shared/ui/back-btn";
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

interface Props {
    /**
     * Evento a editar. Sem ele o formulário cria um novo — é a mesma tela nos
     * dois casos, só muda o que já vem preenchido e para onde o salvar manda.
     */
    evento?: Evento;
}

export function FormEvento({ evento }: Props) {
    const router = useRouter();
    const editando = evento !== undefined;
    const { form, salvamento, salvar, erro } = useFormEvento({
        evento,
        onSucess: (salvo) => {
            router.push(`/admin/eventos/${salvo.id}`);
            router.refresh();
        },
    });

    const erros = form.formState.errors;

    const abaGeralInvalida = abaTemErro("geral", erros);
    const abaDatasInvalida = abaTemErro("datas", erros);
    const abaArquivosInvalida = abaTemErro("arquivos", erros);

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={form.handleSubmit(salvar)}>
                <div className="bg-card sticky top-0 z-20 border-b">
                    <header className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
                        <nav aria-label="Voltar">
                            <GoBackButton
                                href={
                                    editando
                                        ? `/admin/eventos/${evento.id}`
                                        : "/admin/eventos"
                                }
                            />
                        </nav>

                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {editando ? "Editar evento" : "Criar evento"}
                        </h1>
                        <p className="text-muted-foreground my-1.5 w-full text-sm">
                            {editando
                                ? "Revise as informações do evento. As alterações valem assim que você salvar."
                                : "Preencha as informações abaixo. Você pode salvar como rascunho e publicar quando estiver pronto."}
                        </p>
                    </header>
                </div>

                <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <Tabs defaultValue="geral" className="w-full shrink-0 grow">
                        <TabsList
                            className="grid w-full grid-cols-3 sm:w-80"
                            variant={"line"}
                        >
                            <EventoTabTrigger
                                value="geral"
                                icon={<InfoIcon />}
                                invalida={abaGeralInvalida}
                            >
                                Geral
                            </EventoTabTrigger>
                            <EventoTabTrigger
                                value="datas"
                                icon={<CalendarDotsIcon />}
                                invalida={abaDatasInvalida}
                            >
                                Datas
                            </EventoTabTrigger>
                            <EventoTabTrigger
                                value="arquivos"
                                icon={<FilesIcon />}
                                invalida={abaArquivosInvalida}
                            >
                                Arquivos
                            </EventoTabTrigger>
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
                        <PreviewEvento />
                        <ChecklistEvento salvamento={salvamento} />
                        {erro && (
                            <p
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                Não foi possível salvar o evento. Revise os
                                dados e tente novamente.
                            </p>
                        )}
                    </aside>
                </div>
            </form>
        </FormProvider>
    );
}

const camposPorAba = {
    geral: ["nome", "descricao", "local", "unico"],
    datas: ["periodoEvento", "periodoInscricoes"],
    arquivos: ["logo", "cartaz", "regulamento"],
} as const satisfies Record<string, readonly (keyof EventoFormValues)[]>;

type AbaEvento = keyof typeof camposPorAba;

function abaTemErro(aba: AbaEvento, erros: FieldErrors<EventoFormValues>) {
    return camposPorAba[aba].some((campo) => Boolean(erros[campo]));
}

function EventoTabTrigger({
    value,
    icon,
    invalida,
    children,
}: {
    value: AbaEvento;
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
