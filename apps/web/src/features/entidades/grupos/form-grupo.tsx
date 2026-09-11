"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { useForm } from "react-hook-form";

import { Button, FieldError, FieldGroup } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { FormGrupo, GrupoDetalhe } from "./grupo";
import type { GrupoFormValues } from "./grupo-form-schema";
import { CampoAreaTexto } from "~/shared/ui/form/campo-area-texto";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import { ErroDeCampoGrupo } from "./grupo";
import {
    grupoFormDefaults,
    grupoFormInput,
    grupoFormSchema,
} from "./grupo-form-schema";

interface Props {
    /** Grupo em edição. Ausente quando o formulário está criando. */
    grupo?: GrupoDetalhe;
    /**
     * Recebe o grupo pronto para a API. Se rejeitar, o envio não deu certo: o
     * diálogo continua aberto com o que foi digitado, e a mensagem aparece no
     * campo que a regra apontou — ou acima dos botões.
     */
    onSalvar: (dados: FormGrupo) => Promise<void> | void;
    onCancelar: () => void;
}

/**
 * Criação e edição de grupo, dentro de um diálogo.
 *
 * O componente não sabe do diálogo: recebe o que fazer ao salvar e ao cancelar,
 * como o {@link FormIntegrante}. Quem abre é que decide o que acontece com a
 * tela em volta — criar seleciona o grupo novo, editar fica onde está.
 */
export function FormGrupoEntidade({ grupo, onSalvar, onCancelar }: Props) {
    const form = useForm<GrupoFormValues>({
        resolver: zodResolver(grupoFormSchema),
        defaultValues: grupoFormDefaults(grupo),
    });

    const salvar = async (valores: GrupoFormValues) => {
        try {
            await onSalvar(grupoFormInput(valores));
            // Criando, o formulário volta vazio para o próximo grupo; editando,
            // o que foi salvo é o novo ponto de partida.
            form.reset(grupo ? valores : grupoFormDefaults());
        } catch (error) {
            if (error instanceof ErroDeCampoGrupo) {
                form.setError(error.campo, {
                    type: "server",
                    message: error.message,
                });
                return;
            }

            form.setError("root", {
                message:
                    "Não foi possível salvar o grupo. Tente de novo em instantes.",
            });
        }
    };

    const { errors, isSubmitting } = form.formState;

    return (
        <FormProvider {...form}>
            <form
                noValidate
                onSubmit={form.handleSubmit(salvar)}
                className="flex min-h-0 flex-1 flex-col gap-5"
            >
                <FieldGroup className="grid gap-4">
                    <CampoTexto<GrupoFormValues>
                        name="nome"
                        label="Nome do grupo"
                        placeholder="Ex.: Invernada Artística Adulta"
                        helpText="É por ele que o grupo aparece na hora de inscrever."
                    />
                    <CampoAreaTexto<GrupoFormValues>
                        name="descricao"
                        label="Descrição"
                        placeholder="Ex.: Formação que representa a entidade nas danças tradicionais adultas."
                        helpText="Opcional. Para que o grupo serve, em uma frase."
                    />
                </FieldGroup>

                <div className="flex flex-col gap-3 border-t pt-4">
                    {errors.root && <FieldError errors={[errors.root]} />}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancelar}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <SpinnerGapIcon
                                    aria-hidden="true"
                                    className="animate-spin"
                                />
                            ) : (
                                <FloppyDiskIcon aria-hidden="true" />
                            )}
                            {isSubmitting ? "Salvando…" : "Salvar"}
                        </Button>
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
