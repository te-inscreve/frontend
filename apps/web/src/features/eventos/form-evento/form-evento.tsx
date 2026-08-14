"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { Controller, useForm } from "react-hook-form";

import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Field,
    FieldError,
    FieldLabel,
    Input,
    Label,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Textarea,
} from "@te-inscreve/components";

import type { EventoFormValues } from "./evento-form-schema";
import { useObjectUrl } from "~/shared/utils/use-object-url";
import { CampoImagem } from "./campo-imagem";
import { CampoPeriodo } from "./campo-periodo";
import { CampoRegulamento } from "./campo-regulamento";
import { ChecklistEvento } from "./checklist-evento";
import {
    eventoFormDefaults,
    eventoFormSchema,
    inscricoesFechamDepoisDoInicio,
} from "./evento-form-schema";
import { PreviewEvento } from "./preview-evento";

export function FormEvento() {
    const form = useForm<EventoFormValues>({
        resolver: zodResolver(eventoFormSchema),
        defaultValues: eventoFormDefaults,
        mode: "onTouched",
    });

    // A prévia e o checklist acompanham a digitação, então o formulário inteiro
    // re-renderiza a cada tecla — é o preço de ter o cartaz atualizando ao vivo.
    // O React Compiler avisa que não consegue memoizar `watch()`; aqui tanto
    // faz, já que o objetivo é justamente re-renderizar. A alternativa,
    // `useWatch`, devolve um tipo parcial e exigiria um cast.
    const valores = form.watch();
    const erros = form.formState.errors;
    const logoUrl = useObjectUrl(valores.logo);
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

    const avisarInscricoes = inscricoesFechamDepoisDoInicio(
        valores.periodoEvento,
        valores.periodoInscricoes,
    );

    // TODO: ligar em `trpc.evento.create`. O endpoint atual recebe JSON com
    // logo/cartaz/regulamento como URL, então antes é preciso decidir onde os
    // três arquivos sobem.
    const salvar = (_valores: EventoFormValues) => {
        void _valores;
    };

    return (
        <form noValidate onSubmit={form.handleSubmit(salvar)}>
            <div className="bg-card sticky top-0 z-20 border-b">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6">
                    <div>
                        <nav
                            aria-label="Trilha de navegação"
                            className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm"
                        >
                            <CalendarDotsIcon size={16} />
                            <Link
                                href="/admin/eventos"
                                className="hover:text-foreground hover:underline"
                            >
                                Eventos
                            </Link>
                            <CaretRightIcon size={11} />
                            <span aria-current="page">Novo evento</span>
                        </nav>

                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Criar evento
                        </h1>
                        <p className="text-muted-foreground mt-1.5 max-w-lg text-sm">
                            Preencha as informações abaixo. Você pode salvar
                            como rascunho e publicar quando estiver pronto.
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-2.5 md:items-end">
                        <Badge
                            variant={
                                valores.publicado ? "default" : "secondary"
                            }
                        >
                            {valores.publicado ? "Publicado" : "Rascunho"}
                        </Badge>

                        <div className="flex items-center gap-3.5">
                            <div className="flex items-center gap-2">
                                <Controller
                                    name="publicado"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Switch
                                            id="publicado"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                                <Label htmlFor="publicado">
                                    Publicar imediatamente
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl items-start gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <Tabs defaultValue="geral" className="min-w-0">
                    <TabsList className="grid w-full grid-cols-3 sm:w-80">
                        <TabsTrigger
                            value="geral"
                            aria-invalid={abaGeralInvalida}
                            className={
                                abaGeralInvalida ? estiloAbaInvalida : undefined
                            }
                        >
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
                                abaDatasInvalida ? estiloAbaInvalida : undefined
                            }
                        >
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
                                <Controller
                                    name="nome"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="nome">
                                                Nome do evento
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="nome"
                                                className="h-10"
                                                placeholder="Ex.: Festival de Dança 2024"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="descricao"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="descricao">
                                                Descrição
                                            </FieldLabel>
                                            <Textarea
                                                {...field}
                                                id="descricao"
                                                rows={4}
                                                className="min-h-22"
                                                placeholder="Conte o que é o evento, quem promove e o que os participantes podem esperar."
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="local"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="local">
                                                Local
                                            </FieldLabel>
                                            <div className="relative">
                                                <MapPinIcon
                                                    aria-hidden="true"
                                                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                                                />
                                                <Input
                                                    {...field}
                                                    id="local"
                                                    className="h-10 pl-9"
                                                    placeholder="Ex.: Ginásio Municipal de Vacaria"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                />
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <div className="border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <Controller
                                            name="unico"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Switch
                                                    id="unico"
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            )}
                                        />
                                        <Label htmlFor="unico">
                                            Evento único
                                        </Label>
                                    </div>
                                    <p className="text-muted-foreground mt-1.5 max-w-md text-xs">
                                        Desative se este evento terá novas
                                        edições em anos seguintes.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent
                        value="datas"
                        className="mt-3 flex flex-col gap-5"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Período do evento</CardTitle>
                                <CardDescription>
                                    Datas de início e fim do evento
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <Controller
                                    name="periodoEvento"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="periodo-evento">
                                                Datas do evento
                                            </FieldLabel>
                                            <CampoPeriodo
                                                id="periodo-evento"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                invalido={fieldState.invalid}
                                                icone={<CalendarDotsIcon />}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Período de inscrições</CardTitle>
                                <CardDescription>
                                    Quando artistas e grupos podem se inscrever
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <Controller
                                    name="periodoInscricoes"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="periodo-inscricoes">
                                                Datas de inscrição
                                            </FieldLabel>
                                            <CampoPeriodo
                                                id="periodo-inscricoes"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                invalido={fieldState.invalid}
                                                icone={<TicketIcon />}
                                                mesInicial={
                                                    valores.periodoEvento.from
                                                }
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                {avisarInscricoes && (
                                    <p
                                        role="status"
                                        className="bg-accent text-accent-foreground mt-3.5 flex items-start gap-2 rounded-md px-3 py-2.5 text-xs"
                                    >
                                        <WarningCircleIcon
                                            className="text-warning mt-px shrink-0"
                                            size={16}
                                            weight="fill"
                                        />
                                        As inscrições fecham depois do evento
                                        começar. Revise as datas se não for
                                        intencional.
                                    </p>
                                )}
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
                                <Controller
                                    name="logo"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field className="w-auto">
                                            <FieldLabel htmlFor="logo">
                                                Logo
                                            </FieldLabel>
                                            <CampoImagem
                                                id="logo"
                                                label="Logo do evento"
                                                className="size-24"
                                                formato="circulo"
                                                ajuste="contain"
                                                placeholder="Logo"
                                                previewUrl={logoUrl}
                                                onChange={field.onChange}
                                            />
                                            <p className="text-muted-foreground max-w-30 text-xs">
                                                PNG quadrado, fundo transparente
                                            </p>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="cartaz"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field className="w-auto">
                                            <FieldLabel htmlFor="cartaz">
                                                Capa do evento
                                            </FieldLabel>
                                            <CampoImagem
                                                id="cartaz"
                                                label="Cartaz do evento"
                                                className="h-24 w-35"
                                                formato="retangulo"
                                                ajuste="cover"
                                                placeholder="Cartaz"
                                                previewUrl={cartazUrl}
                                                onChange={field.onChange}
                                            />
                                            <p className="text-muted-foreground max-w-35 text-xs">
                                                Usado na pré-visualização ao
                                                lado
                                            </p>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="regulamento"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field className="min-w-55 flex-1">
                                            <FieldLabel htmlFor="regulamento">
                                                Regulamento (PDF)
                                            </FieldLabel>
                                            <CampoRegulamento
                                                id="regulamento"
                                                file={field.value}
                                                onChange={field.onChange}
                                            />
                                        </Field>
                                    )}
                                />
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
                    <Button type="submit" size="lg">
                        <FloppyDiskIcon weight="bold" />
                        Salvar
                    </Button>
                </aside>
            </div>
        </form>
    );
}
