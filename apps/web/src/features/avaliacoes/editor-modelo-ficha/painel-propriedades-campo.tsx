"use client";

import type { FieldPath } from "react-hook-form";
import { useEffect, useRef } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { TipoCampoFicha } from "@te-inscreve/schemas";
import {
    Button,
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    Textarea,
} from "@te-inscreve/components";

import type {
    AlternativaForm,
    CampoExclusivoForm,
    ModeloFichaFormValues,
} from "./lib/modelo-ficha-form-schema";
import { useEditor } from "./editor-contexto";
import { ROTULO_MODIFICADOR, ROTULO_TIPO } from "./lib/campo-exibido";
import { mensagemDaLista } from "./lib/erro-lista";
import {
    campoComTipo,
    camposExclusivos,
    novaAlternativa,
} from "./lib/modelo-ficha-form-schema";

type Caminho = FieldPath<ModeloFichaFormValues>;

/**
 * Painel da direita: as propriedades do campo exclusivo aberto. Só existe com
 * um campo aberto — campo global não tem o que alterar.
 */
export function PainelPropriedadesCampo() {
    const { control } = useFormContext<ModeloFichaFormValues>();
    const { selecionado, selecionar } = useEditor();
    // O painel acompanha a posição pela chave: se ela muda de índice ao ser
    // arrastada, o caminho dos campos muda junto.
    const valores = useWatch({ control }) as ModeloFichaFormValues;
    const aberto = camposExclusivos(valores).find(
        (exclusivo) => exclusivo.chave === selecionado,
    );

    if (!aberto) return null;

    const caminho = aberto.caminho.join(".");

    return (
        <section
            aria-labelledby="propriedades-titulo"
            className="flex flex-col"
        >
            <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <h2 id="propriedades-titulo" className="text-sm font-bold">
                    Propriedades do campo
                </h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar propriedades"
                    onClick={() => selecionar(null)}
                >
                    <XIcon aria-hidden="true" />
                </Button>
            </header>
            {/* A chave remonta o formulário ao trocar de campo: sem ela os
                ids dos controles se repetiriam entre um campo e outro. */}
            <PropriedadesCampo
                key={aberto.chave}
                caminho={caminho}
                campo={aberto.campo}
            />
            <Button type="button" className="mx-4">
                Aplicar
            </Button>
        </section>
    );
}

function PropriedadesCampo({
    caminho,
    campo,
}: {
    caminho: string;
    campo: CampoExclusivoForm;
}) {
    const { control, setValue, getValues, formState } =
        useFormContext<ModeloFichaFormValues>();
    const nome = (sufixo: string) => `${caminho}.${sufixo}` as Caminho;
    const id = (sufixo: string) => `propriedade-${sufixo}`;

    function mudarTipo(tipo: TipoCampoFicha) {
        const atual = getValues(caminho as Caminho) as CampoExclusivoForm;
        setValue(caminho as Caminho, campoComTipo(atual, tipo), {
            shouldDirty: true,
            shouldValidate: formState.isSubmitted,
        });
    }

    function gravarAlternativas(alternativas: AlternativaForm[]) {
        setValue(nome("alternativas"), alternativas, {
            shouldDirty: true,
            shouldValidate: formState.isSubmitted,
        });
    }

    return (
        <FieldGroup className="p-4">
            <Controller
                control={control}
                name={nome("nome")}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={id("nome")}>Nome</FieldLabel>
                        <Input
                            {...field}
                            value={texto(field.value)}
                            id={id("nome")}
                            autoComplete="off"
                            aria-invalid={fieldState.invalid}
                            className="h-10"
                        />
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                control={control}
                name={nome("descricao")}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={id("descricao")}>
                            Descrição
                        </FieldLabel>
                        <Textarea
                            {...field}
                            value={texto(field.value)}
                            id={id("descricao")}
                            rows={3}
                            placeholder="Orientação para o jurado"
                            aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                control={control}
                name={nome("tipo")}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={id("tipo")}>Tipo</FieldLabel>
                        <Select
                            value={texto(field.value)}
                            onValueChange={(valor) =>
                                mudarTipo(valor as TipoCampoFicha)
                            }
                        >
                            <SelectTrigger
                                id={id("tipo")}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                aria-invalid={fieldState.invalid}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ROTULO_TIPO).map(
                                    ([tipo, rotulo]) => (
                                        <SelectItem key={tipo} value={tipo}>
                                            {rotulo}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                control={control}
                name={nome("obrigatorio")}
                render={({ field, fieldState }) => (
                    <Field
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                        className="justify-between"
                    >
                        <FieldLabel htmlFor={id("obrigatorio")}>
                            Preenchimento obrigatório
                        </FieldLabel>
                        <Switch
                            id={id("obrigatorio")}
                            ref={field.ref}
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                        />
                    </Field>
                )}
            />

            {campo.tipo === "NUMERICO" && (
                <>
                    <Controller
                        control={control}
                        name={nome("modificadorNota")}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={id("modificador")}>
                                    Efeito na nota
                                </FieldLabel>
                                <Select
                                    value={texto(field.value)}
                                    onValueChange={(valor) =>
                                        field.onChange(valor)
                                    }
                                >
                                    <SelectTrigger
                                        id={id("modificador")}
                                        ref={field.ref}
                                        onBlur={field.onBlur}
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <SelectValue placeholder="Escolha" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROTULO_MODIFICADOR).map(
                                            ([modificador, rotulo]) => (
                                                <SelectItem
                                                    key={modificador}
                                                    value={modificador}
                                                >
                                                    {rotulo}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                    <Controller
                        control={control}
                        name={nome("valorMaximo")}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={id("valor-maximo")}>
                                    Nota máxima
                                </FieldLabel>
                                <Input
                                    {...field}
                                    value={texto(field.value)}
                                    id={id("valor-maximo")}
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="Sem limite"
                                    aria-invalid={fieldState.invalid}
                                    className="h-10"
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </>
            )}

            {campo.tipo === "ALTERNATIVA_MULTIPLA" && (
                <Alternativas
                    caminho={nome("alternativas")}
                    alternativas={campo.alternativas}
                    gravar={gravarAlternativas}
                />
            )}
        </FieldGroup>
    );
}

function Alternativas({
    caminho,
    alternativas,
    gravar,
}: {
    caminho: Caminho;
    alternativas: AlternativaForm[];
    gravar: (alternativas: AlternativaForm[]) => void;
}) {
    const { control, getFieldState, formState } =
        useFormContext<ModeloFichaFormValues>();
    const estadoLista = getFieldState(caminho, formState);
    const mensagemLista = mensagemDaLista(formState.errors, caminho);
    // A alternativa nova recebe o foco assim que aparece: quem clicou em
    // "Adicionar" vai digitar o texto dela em seguida.
    const focar = useRef<string | null>(null);

    useEffect(() => {
        if (!focar.current) return;
        document.getElementById(`alternativa-${focar.current}`)?.focus();
        focar.current = null;
    }, [alternativas]);

    function adicionar() {
        const nova = novaAlternativa();
        gravar([...alternativas, nova]);
        focar.current = nova.chave;
    }

    return (
        <Field data-invalid={estadoLista.invalid}>
            <FieldLabel asChild>
                <span id="propriedade-alternativas">Alternativas</span>
            </FieldLabel>
            <ul
                aria-labelledby="propriedade-alternativas"
                className="flex flex-col gap-2"
            >
                {alternativas.map((alternativa, indice) => (
                    <li key={alternativa.chave}>
                        <Controller
                            control={control}
                            name={`${caminho}.${indice}.nome` as Caminho}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <div className="flex items-center gap-1">
                                        <FieldLabel
                                            htmlFor={`alternativa-${alternativa.chave}`}
                                            className="sr-only"
                                        >
                                            Alternativa {indice + 1}
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            value={texto(field.value)}
                                            id={`alternativa-${alternativa.chave}`}
                                            autoComplete="off"
                                            placeholder={`Alternativa ${indice + 1}`}
                                            aria-invalid={fieldState.invalid}
                                            className="h-9"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost-destructive"
                                            size="icon-sm"
                                            aria-label={`Remover alternativa ${indice + 1}`}
                                            onClick={() =>
                                                gravar(
                                                    alternativas.filter(
                                                        (outra) =>
                                                            outra.chave !==
                                                            alternativa.chave,
                                                    ),
                                                )
                                            }
                                        >
                                            <TrashIcon aria-hidden="true" />
                                        </Button>
                                    </div>
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                    </li>
                ))}
            </ul>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={adicionar}
            >
                <PlusIcon aria-hidden="true" />
                Adicionar alternativa
            </Button>
            {mensagemLista && <FieldError>{mensagemLista}</FieldError>}
        </Field>
    );
}

function texto(valor: unknown) {
    return typeof valor === "string" ? valor : "";
}
