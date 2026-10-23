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

# Animações

Aplica-se a todo modal escrito em `frontend/apps/web`.

- Quando o modal é a continuação de um item já visível na tela — cartão de lista, linha de tabela, atalho em forma de cartão —, ele se expande a partir desse item em vez de aparecer no centro. Use `ExpandableDialog` de `@te-inscreve/components`, não o `Dialog`.
- Confirmação destrutiva, aviso e formulário aberto por botão de barra continuam em `AlertDialog` ou `Dialog` comuns: expandir tudo tira o significado da expansão.
- A técnica usa shared layout animations do [Motion](https://motion.dev/docs/react) e tem armadilhas que parecem código estranho (`forceMount`, `borderRadius` em `style`, `layoutScroll`). Leia `docs/animacoes.md` antes de mexer no primitivo ou de aplicá-lo em um lugar novo.

# Renderização (FCP)

Aplica-se a toda tela escrita em `frontend/apps/web`.

- Nenhum `await` no corpo de `page.tsx` ou `layout.tsx`. A página é síncrona, `params`/`searchParams` saem de `use(Promise.all([...]))`, e todo dado desce para um Server Component assíncrono atrás do seu próprio `<Suspense>`. Um `await` em `layout.tsx` segura todas as rotas abaixo dele.
- Dispare os dados com `void prefetch(trpc....queryOptions(...))` no topo da página e consuma com `await getQueryClient().fetchQuery(...)` no filho suspenso: o query client é `cache`ado por request, então é a mesma requisição, não duas.
- O boundary fica o mais fundo possível — um por unidade de espera independente — e o fallback tem a geometria do conteúdo final. Skeleton para carregamento de estrutura, spinner só para ação localizada.
- Exceções são pontuais e justificadas por comentário no próprio arquivo: `defaultValues` de formulário, portão que decide se a página existe, leitura de `cookies()`. Elas justificam um `await`, não a página inteira.
- `app/admin/eventos/[slug]/modalidades/[slugModalidade]/page.tsx` é o exemplo canônico. Leia `docs/fcp.md` antes de criar uma tela nova ou de acrescentar uma espera a uma existente.

# Aparelho físico (mobile)

Aplica-se a rodar ou testar `frontend/apps/mobile` num aparelho Android.

- O app roda como build de desenvolvimento (`expo-dev-client`), não no Expo Go: desde o SDK 58 a `formSheet` não aparece no Expo Go, e tarefa em segundo plano exige o build. `apps/mobile/android` é gerado por `expo prebuild` e não vai para o git; refaça o build só quando o lado nativo mudar.
- O app alcança Metro e BFF pelo Wi-Fi: Metro em `--lan` (configuração `mobile` em `.claude/launch.json`). O login também depende da API REST na 8002. O `adb` serve só para o agente testar. Mantenha o `--lan`: `--localhost` com `adb reverse` foi abandonado porque o redirecionamento cai a cada reconexão do cabo.
- Leia `docs/dispositivo-mobile.md` antes de compilar, de mudar essa configuração ou quando o aparelho não alcançar a máquina.

## Agent skills

### Issue tracker

Issues e specs ficam no Linear, time `TE` (Te-inscreve), acessado pelo MCP do Linear; issues deste repo levam o label `Frontend`. Ver `docs/agents/issue-tracker.md`.

### Triage labels

Os cinco papéis canônicos com os nomes padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), criados no time `TE`. Ver `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `GLOSSARY-MAP.md` na raiz aponta um `GLOSSARY.md` por contexto de negócio em `docs/contextos/<contexto>/`. Ver `docs/agents/domain.md`.
