"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";
import { Controller, useForm } from "react-hook-form";

import {
    Badge,
    Button,
    buttonVariants,
    cn,
    DialogTitle,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogFooter,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogTrigger,
    Field,
    FieldError,
    FieldLabel,
    Label,
    Switch,
} from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "./lib/filtros-integrantes-schema";
import type { FiltrosIntegrantesForm } from "./lib/use-filtros-integrantes";
import { NumberInput } from "~/shared/ui/number-input";
import {
    filtrosAvancadosAtivos,
    filtrosVazios,
} from "./lib/filtros-integrantes";
import { filtrosIntegrantesSchema } from "./lib/filtros-integrantes-schema";

interface Props {
    /** O recorte em uso, que o "Aplicar" substitui. */
    filtros: FiltrosIntegrantesForm;
}

/**
 * Os filtros que não cabem na barra: faixa de idade e matrícula vencida.
 *
 * O diálogo é um formulário próprio, um rascunho do recorte em uso: nasce dos
 * valores dele a cada abertura e só os substitui no "Aplicar". Filtrar a cada
 * clique não adiantaria nada aqui — a lista está atrás do overlay, e a pessoa
 * não veria o efeito enquanto escolhe.
 *
 * Expande a partir do próprio botão em vez de aparecer no centro: o rótulo dos
 * dois lados é a mesma palavra, então o que abre não é outra coisa — é o
 * "Filtros" da barra crescendo até caber as escolhas, e encolhendo de volta
 * para o lugar de onde saiu. É o caso do `BotaoEditarCategoria` em
 * `docs/animacoes.md`, e não o do formulário solto que um botão de barra abre.
 */
export function DialogFiltros({ filtros }: Props) {
    const [aberto, setAberto] = useState(false);
    const rascunho = useForm<FiltrosIntegrantes>({
        resolver: zodResolver(filtrosIntegrantesSchema),
        defaultValues: filtrosVazios,
    });

    const ativos = filtrosAvancadosAtivos(filtros.valores);

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura: assim o diálogo
        // não guarda escolhas que a pessoa abandonou da última vez.
        if (proximo) rascunho.reset(filtros.form.getValues());
        setAberto(proximo);
    };

    const aplicar = rascunho.handleSubmit((valores) => {
        filtros.form.reset(valores);
        setAberto(false);
    });

    const limpar = () =>
        rascunho.reset({
            ...rascunho.getValues(),
            idadeMinima: null,
            idadeMaxima: null,
            somenteVencidas: false,
        });

    return (
        <ExpandableDialog
            id="filtros-integrantes"
            open={aberto}
            onOpenChange={abrir}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o navegador passa a interpolar, com os
                150ms dele, o `transform` que o Motion reescreve a cada quadro —
                o gatilho fica para trás do modal. */}
            <div className="relative">
                <ExpandableDialogTrigger
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-10 transition-colors",
                    )}
                >
                    <FunilCompartilhado />
                    {/* `font-semibold` porque o rótulo padrão é `font-medium` e
                    trocaria o peso do texto do botão; é também o peso do
                    título, e o que viaja no morph é o tamanho, não a espessura. */}
                </ExpandableDialogTrigger>
                {ativos > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1.5 -right-1.5 aspect-square px-1.5"
                    >
                        {ativos}
                    </Badge>
                )}
            </div>

            <ExpandableDialogContent className="max-w-md!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <FunilCompartilhado />
                        <DialogTitle className="text-primary">
                            Filtros
                        </DialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        Recorte a lista pela idade que define a categoria e pela
                        situação da matrícula.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                {/* O rodapé vive dentro do corpo, e não ao lado dele: assim os
                    botões entram na mesma aparição atrasada dos campos, em vez
                    de já estarem lá enquanto a caixa ainda cresce. O `form` é
                    `contents` para não interromper o flex do corpo. */}
                <ExpandableDialogBody className="gap-5">
                    <form noValidate onSubmit={aplicar} className="contents">
                        {/* Nenhuma ponta limita a outra enquanto se digita — a
                            inversão é regra do schema, cobrada no "Aplicar".
                            O `deps` da mínima revalida a máxima: é nela que o
                            erro da inversão mora, e corrigir a mínima também
                            o resolve. */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Controller
                                control={rascunho.control}
                                name="idadeMinima"
                                rules={{ deps: ["idadeMaxima"] }}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="filtro-idade-minima">
                                            Idade mínima
                                        </FieldLabel>
                                        <NumberInput
                                            {...field}
                                            id="filtro-idade-minima"
                                            onChange={(valor) =>
                                                field.onChange(valor ?? null)
                                            }
                                            min={0}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Sem mínimo"
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
                                control={rascunho.control}
                                name="idadeMaxima"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="filtro-idade-maxima">
                                            Idade máxima
                                        </FieldLabel>
                                        <NumberInput
                                            {...field}
                                            id="filtro-idade-maxima"
                                            onChange={(valor) =>
                                                field.onChange(valor ?? null)
                                            }
                                            min={0}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Sem máximo"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <Controller
                                control={rascunho.control}
                                name="somenteVencidas"
                                render={({ field }) => (
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="filtro-vencidas"
                                            name={field.name}
                                            ref={field.ref}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            onBlur={field.onBlur}
                                        />
                                        <Label htmlFor="filtro-vencidas">
                                            Somente matrículas vencidas
                                        </Label>
                                    </div>
                                )}
                            />
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                Quem está com a matrícula vencida não pode ser
                                inscrito no evento — é a lista de quem precisa
                                renovar.
                            </p>
                        </div>

                        <ExpandableDialogFooter className="border-t pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={limpar}
                            >
                                Limpar
                            </Button>
                            <Button type="submit">Aplicar filtros</Button>
                        </ExpandableDialogFooter>
                    </form>
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * O funil que viaja do botão para o cabeçalho do modal — do mesmo tamanho e da
 * mesma cor nos dois lados.
 *
 * Sem o disco do `ExpandableDialogIcon` padrão: o gatilho é um botão compacto,
 * e um selo de 36px dentro dele estouraria a altura. Crescer no caminho também
 * não serve — elemento compartilhado que muda de tamanho é escalado pelo
 * Motion, e escala em ícone deforma.
 */
function FunilCompartilhado() {
    return (
        <ExpandableDialogIcon className="text-primary size-4 bg-transparent">
            <FunnelIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
