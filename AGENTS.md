# Formulários

Aplica-se a todo formulário escrito em `frontend/apps/web`.

- Use React Hook Form com Zod: `useForm`, `zodResolver`, `defaultValues` e `form.handleSubmit`.
- Para controles do shadcn, use `Controller` e a composição do pacote compartilhado: `FieldGroup` → `Field` → `FieldLabel` → controle → `FieldError`.
- Importe primitivos de `@te-inscreve/components`. Os componentes de formulário compartilhados vivem em `packages/components/src/components/field.tsx`.
- Em cada campo controlado, passe `data-invalid={fieldState.invalid}` ao `Field`, `aria-invalid={fieldState.invalid}` ao controle e renderize `FieldError` com `errors={[fieldState.error]}` quando inválido.
- Quando o schema representar contrato de entrada/saída da API ou regra de domínio reutilizável, mantenha-o em `packages/schemas/` para uso também pelo app mobile. Para validações, rótulos ou mensagens exclusivos da interface, use `features/<feature>/lib/*-schema.ts`; não replique regras de negócio no componente.
- Preserve semântica e acessibilidade: `label` associado por `htmlFor`/`id`, `autoComplete` correto e `noValidate` quando a validação Zod deve comandar o feedback.
- Prefira componentes reutilizáveis no pacote compartilhado a markup ou APIs legadas de formulário. Só adicione novos primitivos quando forem genéricos e necessários em mais de um formulário.
- Valide alterações com `yarn workspace @te-inscreve/components lint -- <arquivo>`, `yarn workspace @te-inscreve/components typecheck`, `yarn workspace @te-inscreve/nextjs lint -- <arquivo>` e `yarn workspace @te-inscreve/nextjs typecheck`, conforme aplicável.
