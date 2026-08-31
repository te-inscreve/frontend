"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";

import { Button } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { ModalidadeRapidaFormValues } from "../form-modalidade/modalidade-form-schema";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import { useFormModalidadeRapida } from "./use-form-modalidade-rapida";

interface Props {
    eventoId: number;
    /** Fecha o popover — quem o abriu é que guarda esse estado. */
    onCriada: () => void;
}

/**
 * Cadastro rápido de modalidade: o nome e mais nada.
 *
 * A modalidade nasce com as regras no padrão e sem categoria, e vira aba na
 * hora — a ideia é cadastrar a fila inteira de uma vez e detalhar cada uma
 * depois. Quem já sabe as regras vai pelo cadastro completo, no rodapé.
 *
 * Sem atualização otimista: a aba nova só aparece depois que o servidor
 * confirma, então o que se vê na régua é sempre o que existe no backend.
 */
export function FormModalidadeRapida({ eventoId, onCriada }: Props) {
    const router = useRouter();
    const { form, salvamento, salvar, erro, erroDeOutroCampo } =
        useFormModalidadeRapida({
            eventoId,
            onSuccess: (modalidade) => {
                // A modalidade recém-criada é a aba que abre — é nela que o
                // organizador vai cadastrar as categorias.
                router.push(
                    `/admin/eventos/${eventoId}?modalidade=${modalidade.id}`,
                );
                router.refresh();
                onCriada();
            },
        });

    // Ocupado também no "success": entre a resposta e o popover fechar ainda
    // dá tempo de clicar de novo, e o cadastro sairia em duplicata.
    const salvando = salvamento !== "idle";

    return (
        <FormProvider {...form}>
            <form
                noValidate
                onSubmit={form.handleSubmit(salvar)}
                className="flex flex-col gap-3"
            >
                <CampoTexto<ModalidadeRapidaFormValues>
                    name="nome"
                    // label="Nome da modalidade"
                    // helpText="A modalidade entra com as regras no padrão."
                    placeholder="Nome da modalidade"
                />

                {/* O erro do nome já aparece no campo; aqui fica o que não
                    tem onde pousar — inclusive o de um campo que este
                    formulário não mostra. */}
                {erro && !form.formState.errors.nome && (
                    <p role="alert" className="text-destructive text-xs">
                        {erroDeOutroCampo ??
                            "Não foi possível criar a modalidade. Tente novamente."}
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    <Button type="submit" size="sm" disabled={salvando}>
                        {salvando ? (
                            <CircleNotchIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        ) : (
                            <LightningIcon aria-hidden="true" />
                        )}
                        {salvando ? "Criando…" : "Criação rápida"}
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="justify-center"
                    >
                        <Link
                            href={`/admin/eventos/${eventoId}/modalidades/criar`}
                        >
                            Cadastro completo
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-3"
                            />
                        </Link>
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
