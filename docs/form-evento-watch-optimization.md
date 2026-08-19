# Otimização das assinaturas do formulário de eventos

## Contexto

O formulário de eventos usa `react-hook-form` e possui componentes derivados
do estado do formulário, como `PreviewEvento` e `ChecklistEvento`.

O uso de:

```tsx
const valores = useWatch({ control });
```

faz o componente observar todos os campos do formulário. Isso não remonta o
formulário inteiro, mas ainda pode provocar atualizações desnecessárias no
componente observado quando campos sem relação com sua responsabilidade são
alterados.

## Campos usados pelo preview

`PreviewEvento` depende somente dos seguintes campos:

- `nome`
- `local`
- `cartaz`
- `periodoEvento`
- `periodoInscricoes`
- `publicado`

A implementação pode restringir a assinatura para esses campos:

```tsx
const valores = useWatch({
    control,
    name: [
        "nome",
        "local",
        "cartaz",
        "periodoEvento",
        "periodoInscricoes",
        "publicado",
    ],
});
```

Alterações em `descricao`, `unico`, `logo` ou `regulamento` não precisam
atualizar a pré-visualização.

## Campos usados pelo checklist

`ChecklistEvento` depende somente dos seguintes campos:

- `nome`
- `descricao`
- `local`
- `periodoEvento`
- `periodoInscricoes`

A assinatura pode ser restringida assim:

```tsx
const valores = useWatch({
    control,
    name: [
        "nome",
        "descricao",
        "local",
        "periodoEvento",
        "periodoInscricoes",
    ],
});
```

Alterações em arquivos ou no status de publicação não precisam atualizar o
checklist.

## Organização sugerida

Se a lógica crescer, podem ser criados hooks específicos para deixar as
dependências explícitas:

```tsx
function usePreviewEventoValues() {
    const { control } = useFormContext<EventoFormValues>();

    return useWatch({
        control,
        name: [
            "nome",
            "local",
            "cartaz",
            "periodoEvento",
            "periodoInscricoes",
            "publicado",
        ],
    });
}
```

E, para o checklist:

```tsx
function useChecklistEventoValues() {
    const { control } = useFormContext<EventoFormValues>();

    return useWatch({
        control,
        name: [
            "nome",
            "descricao",
            "local",
            "periodoEvento",
            "periodoInscricoes",
        ],
    });
}
```

Essa abordagem mantém cada componente inscrito somente nas mudanças que podem
alterar sua saída e evita que novas alterações no formulário aumentem
silenciosamente o custo de renderização.

## Status

Esta é uma proposta de otimização documentada. Ela ainda não foi aplicada no
código.
