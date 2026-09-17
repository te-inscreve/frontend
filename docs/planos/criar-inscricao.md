# Plano: página "Criar Inscrição" (inscrição de integrantes numa categoria)

## Context

A rota `apps/web/src/app/admin/eventos/[slug]/categorias/[slugCategoria]/inscricoes/criar/page.tsx` foi criada em 1725000 e renomeada em 2052a31, mas só renderiza a trilha. O botão "Inscrever-se" do detalhe da categoria já aponta para ela (`?modalidade=<id>`). A página deve deixar a entidade de quem está logado escolher quem se apresenta na categoria: um grupo (com exclusões) e/ou integrantes avulsos. O envio ainda é mock — o backend não expõe `inscricao.create`; o payload fica em estado e vai para o console.

Decisões já tomadas com o usuário:
- Preencher a rota existente `inscricoes/criar` (não criar `criar/`).
- Um grupo por inscrição; escolher outro grupo **substitui** (zera exclusões, mantém incluídos avulsos).
- Busca por nome é **client-side** sobre as páginas carregadas (a API não tem `search`).
- Portão de entidade igual ao de `/admin/minha-entidade`: `getPerfil()` + `temEntidade` → `SolicitarAcesso`.
- Filtros (diálogo "Filtros") são mock; listas, entidade, categoria e modalidade vêm da API.

Conforme `docs/fcp.md`: página síncrona, `void prefetch` no topo, um `<Suspense>` por espera, `HydrateClient` + `useQuery`/`useInfiniteQuery` (nunca a variante suspense). Tudo em pt-BR, JSDoc explicando o porquê.

## Fatos que moldam o plano

- `app/admin/layout.tsx`: `SidebarInset` é `h-svh overflow-hidden`, filho `min-h-0 flex-1 overflow-y-auto` → o wrapper `lg:h-full lg:min-h-0` de `grupos/[id]/page.tsx` funciona e deve ser copiado literalmente.
- Radix `Tabs`: `TabsList` (no cabeçalho) e `TabsContent` (no corpo) precisam do mesmo `Tabs` root → o root envolve a `LadoDaBancada` inteira.
- `useVerticalScroll` observa o ref uma vez no mount; `TabsContent` inativo desmonta → **cada lista chama o hook**, não o pai.
- `BarraFiltros`/`DialogFiltros` usam ids fixos; só uma aba está montada por vez, então reutilizar para Integrantes é seguro. Grupos ganha ids próprios.
- `entidade.minha` devolve `null` em 403/404 (não lança); `prefetch` engole rejeições — prefetch antes do portão é seguro.
- Monorepo é **yarn**; pacote web é `@te-inscreve/nextjs`.
- Tokens `--color-background`/`--color-border` existem no `@theme` → `fill-background`/`stroke-border` são utilitários válidos.
- Nenhum componente de ticket/picote existe no repo.

## Arquivos a modificar

### 1. `features/entidades/grupos/bancada.tsx` — slot `abas`
Prop opcional `abas?: React.ReactNode` em `LadoDaBancada`. O `<header>` vira `flex-col gap-2`; a linha atual (título + `acoes`) fica numa `div flex items-start gap-3`; com `abas`, o header usa `pb-0` e renderiza `{abas}` embaixo. JSDoc: abas ficam no cabeçalho porque dizem *o que este lado lista* (etiqueta, mesma superfície `bg-card`). Chamadores atuais não mudam.

### 2. `features/entidades/grupos/cartao-grupo.tsx` — extrair `ConteudoCartaoGrupo`
`export function ConteudoCartaoGrupo({ grupo, sinal }: { grupo: GrupoComPrevia; sinal: React.ReactNode })` com o miolo (h3, descrição, `AvataresGrupo`, badge vencida, data). `CartaoGrupo` passa a compor `<Link><ConteudoCartaoGrupo sinal={<CaretRightIcon/>}/></Link>`. Sem `"use client"`.

### 3. `app/admin/minha-entidade/layout.tsx` — extrair o portão
Mover `PortaoDaEntidade` (com JSDoc) para `features/entidades/solicitar-acesso/portao-da-entidade.tsx` (`export async function PortaoDaEntidade({ children })`). O layout importa de lá. A página de inscrição usa o mesmo portão.

### 4. `…/inscricoes/criar/page.tsx`
```tsx
export const metadata = { title: "Criar inscrição | Te Inscreve", description: "Inscrição da entidade em uma categoria" };
const GRUPOS_POR_PAGINA = 12;       // grupos/page.tsx
const INTEGRANTES_POR_PAGINA = 20;  // grupos/[id]/page.tsx

// parse eventoId/categoriaId/modalidadeId + notFound() como hoje
void prefetch(trpc.evento.getById.queryOptions({ id: eventoId }));
void prefetch(trpc.categoria.getById.queryOptions({ eventoId, modalidadeId, categoriaId }));
void prefetch(trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }));
void prefetch(trpc.entidade.minha.queryOptions());
void prefetch(trpc.grupo.list.infiniteQueryOptions({ pageSize: GRUPOS_POR_PAGINA }, { getNextPageParam: proximaPagina }));
void prefetch(trpc.integrante.list.infiniteQueryOptions({ pageSize: INTEGRANTES_POR_PAGINA }, { getNextPageParam: proximaPagina }));

<div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:h-full lg:min-h-0">
  <Suspense fallback={<TrilhaEventoSkeleton />}><TrilhaInscricao … /></Suspense>
  <h1 className="text-primary text-2xl font-bold tracking-tight">Criar Inscrição</h1>
  {/* Portão = exceção 2 de docs/fcp.md; trilha e título ficam fora e pintam na hora */}
  <Suspense fallback={<BancadaInscricaoSkeleton />}>
    <PortaoDaEntidade>
      <HydrateClient>
        <BancadaInscricao eventoId modalidadeId categoriaId gruposPorPagina integrantesPorPagina />
      </HydrateClient>
    </PortaoDaEntidade>
  </Suspense>
</div>
```
JSDoc: prefetches antes do portão correm em paralelo com o perfil (quem não tem entidade paga requisições que falham em silêncio — troca aceitável); `HydrateClient` dentro do portão desidrata com as queries pendentes serializadas.

## Arquivos novos — filtros de grupos (`features/entidades/grupos/`)

- `filtros-grupos.ts`: `interface FiltrosGrupos { nome: string; somenteComPendencia: boolean }`, `filtrosGruposVazios`, `temFiltroGrupoAtivo`, `filtrarGrupos(grupos, filtros)` (nome case-insensitive `includes`; pendência por `pendenciaCarteiraVencida`). JSDoc espelha `filtros-integrantes.ts`.
- `dialog-filtros-grupos.tsx`: cópia enxuta de `dialog-filtros.tsx` — `ExpandableDialog id="filtros-grupos"`, rascunho, um `Switch` "Somente grupos com matrícula vencida", rodapé Limpar/Aplicar. JSDoc: é o esqueleto do diálogo; os demais recortes entram quando o backend os expuser.
- `barra-filtros-grupos.tsx`: `BarraFiltrosGrupos({ filtros, onChange, resultados, total })`, mesmo layout de `BarraFiltros` (input `id="filtro-nome-grupos"`, contagem "N grupos").

## Arquivos novos — `features/inscricoes/`

### `selecao-inscricao.ts` — estado puro e regras
```ts
export interface SelecaoInscricao { grupo: GrupoComPrevia | null; incluidos: Integrante[]; excluidos: number[] }
export interface PayloadInscricao { grupo: number | null; integrantes_incluidos: number[]; integrantes_excluidos: number[] }
export const selecaoVazia
export function escolherGrupo(s, grupo): SelecaoInscricao
export function alternarIntegrante(s, integrante, membrosDoGrupo: ReadonlySet<number>): SelecaoInscricao
export function montarTicket(s, integrantesDoGrupo: Integrante[]): { integrante; origem: "grupo" | "individual" }[]
export function montarPayload(s, membrosDoGrupo): PayloadInscricao
```
Regras (JSDoc):
- `escolherGrupo`: mesmo id → desmarca (`grupo: null`, `excluidos: []`); outro id → substitui, `excluidos` zera, `incluidos` fica.
- Dedupe: **o grupo vence** — incluído que também é membro do grupo não aparece duas vezes nem vai em `integrantes_incluidos` (`montarPayload` filtra por `!membrosDoGrupo.has(id)`); o registro fica em `incluidos` para voltar a contar se o grupo for trocado.
- `alternarIntegrante`: membro do grupo → alterna em `excluidos` e o remove de `incluidos`; senão → alterna em `incluidos`.
- `montarTicket`: membros não excluídos (origem `grupo`), depois incluídos que não são membros (origem `individual`).

### `use-inscricao.ts` (`"use client"`) — modelo `use-detalhe-grupo.ts`
Entrada `{ eventoId, modalidadeId, categoriaId, gruposPorPagina, integrantesPorPagina }`.
- `useQuery`: `entidade.minha`, `categoria.getById`, `modalidade.getById`; `grupo.getById` com `enabled: selecao.grupo !== null` (`{...queryOptions({ id: selecao.grupo?.id ?? 0 }), enabled}`), `membrosDoGrupo = Set(ids)`.
- `useInfiniteQuery`: `grupo.list`, `integrante.list` (flatMap, `total`, `carregarMais*` com `useCallback`).
- Estado: `selecao`, `filtrosIntegrantes` (`FiltrosIntegrantes`), `filtrosGrupos` (`FiltrosGrupos`).
- Derivados: `gruposVisiveis`, `integrantesVisiveis`, `linhasDoTicket`, `selecionados: Set<number>`, `payload`.
- Ações: `escolherGrupo`, `alternarIntegrante`, `criarInscricao()` → `console.info("[inscricao] payload", payload)` + guarda `ultimoEnvio`. JSDoc: mock até `inscricao.create` existir.
- Retorno agrupado: `entidade`, `categoria`, `modalidade`, `grupos: { itens, total, carregando, erro, isFetchingNextPage, carregarMais, filtros, setFiltros }`, `integrantes: {…}`, `selecao`, `grupoDetalhe: { integrantes, carregando }`, `linhasDoTicket`, `selecionados`, `payload`, ações.

### `bancada-inscricao.tsx` (`"use client"`)
Espelha `DetalheGrupoPagina`: `MotionConfig reducedMotion="user"` + grade `grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-[22rem_auto_minmax(0,1fr)]`. Coluna do meio: `span` tracejado decorativo (`hidden lg:block lg:order-2 border-l border-dashed border-border/70`), sem botão. Filhos `<ColunaEntidade className="order-2 lg:order-1"/>` e `<TicketInscricao className="order-1 lg:order-3"/>`.

### `coluna-entidade.tsx` — lado esquerdo
```tsx
<Tabs defaultValue="grupos" className={cn("flex min-h-0 flex-col gap-0", className)}>
  <LadoDaBancada titulo={entidade?.nome ?? "Minha entidade"} descricao="Escolha um grupo ou marque integrantes um a um."
    abas={<TabsList variant="line" className="w-full justify-start border-b-0">
            <TabsTrigger value="grupos" className="flex-none"><UsersFourIcon/>Grupos</TabsTrigger>
            <TabsTrigger value="integrantes" className="flex-none"><UsersThreeIcon/>Integrantes</TabsTrigger>
          </TabsList>}
    className="min-h-0 flex-1">
    <TabsContent value="grupos" className="flex min-h-0 flex-1 flex-col gap-3"><ListaGruposSelecao …/></TabsContent>
    <TabsContent value="integrantes" className="flex min-h-0 flex-1 flex-col gap-3"><ListaIntegrantesSelecao …/></TabsContent>
  </LadoDaBancada>
</Tabs>
```
`border-b-0` porque o header já tem `border-b`. Abas por estado (não URL): as listas são cache do cliente — exceção da seção 6 de `fcp.md`, anotar.

### `lista-grupos-selecao.tsx` / `lista-integrantes-selecao.tsx`
Cada uma chama `useVerticalScroll({ onScrollEnd: carregarMais })`. Estrutura de `ColunaIntegrantes`: barra de filtros, `div` rolável `-mx-1 min-h-0 flex-1 overflow-y-auto px-1`, `Conteudo…` (carregando → 4× `CartaoGrupoSkeleton` / 5× `CartaoIntegranteSkeleton`; erro; vazio com/sem filtro; lista `ul grid gap-3` numa coluna), esqueletos de `isFetchingNextPage`, sentinela `h-px`. Integrantes reutiliza `BarraFiltros` + `filtrarIntegrantes`.

### `cartao-grupo-selecao.tsx`
`<li><button type="button" aria-pressed={selecionado} aria-label={selecionado ? `Tirar o grupo ${nome} da inscrição` : `Inscrever o grupo ${nome}`} className={cn(base, selecionado ? "border-primary bg-primary/5 hover:border-destructive/50 hover:bg-destructive/5" : "bg-card border-border/70 hover:border-primary/50 hover:bg-primary/5")}><ConteudoCartaoGrupo grupo sinal={selecionado ? <CheckCircleIcon weight="fill" className="text-primary"/> : <PlusCircleIcon/>}/></button></li>`

### `cartao-integrante-inscricao.tsx`
Novo, não reutiliza `CartaoIntegranteSelecao`: aquele tem `layoutId="grupo-integrante-{id}"` e rótulos "do grupo", e aqui o cartão **permanece na lista** (marcado) enquanto uma cópia aparece no ticket — dois `layoutId` iguais ao mesmo tempo quebram. **Sem `layoutId`**; o ticket anima entrada/saída com `AnimatePresence initial={false} mode="popLayout"` + `motion.li layout` (padrão de `grade-grupos.tsx`). Props `{ integrante, lado: "lista" | "ticket", selecionado?, origem?, onAlternar }`. Conteúdo: `AvatarUsuario` 36 + nome + `ResumoIntegrante` + `AvisoMatricula` + ícone (lista: Plus/CheckCircle; ticket: MinusCircle). No ticket, origem `grupo` leva `Badge variant="outline"` "Do grupo". Rótulos "Incluir X na inscrição" / "Tirar X da inscrição".

### `ticket-inscricao.tsx` — lado direito em forma de bilhete
Sibling de `LadoDaBancada` (mesma casca `bg-muted/40 flex min-w-0 flex-col rounded-xl border`, `section aria-labelledby`); JSDoc explica que o bilhete tem três superfícies e dois picotes.
```tsx
<section className={cn("bg-muted/40 flex min-w-0 flex-col rounded-xl border", className)}>
  <header className="bg-card flex shrink-0 flex-col gap-0.5 rounded-t-xl px-4 py-3">
    <p className="text-muted-foreground text-xs">Inscrição em</p>
    <h2 className="truncate text-lg font-bold tracking-tight">{categoria?.nome ?? "…"}</h2>
    {selecao.grupo && <p className="text-muted-foreground text-xs">Grupo <b>{selecao.grupo.nome}</b></p>}
  </header>
  <RecorteDoTicket />
  <div className="min-h-0 flex-1 overflow-y-auto p-3">  {/* vazio tracejado como DetalheGrupo; lista com AnimatePresence; skeletons enquanto grupo.getById carrega */}
  <RecorteDoTicket />
  <footer className="bg-card flex shrink-0 flex-col gap-3 rounded-b-xl px-4 py-3">
    <RestricoesDaCategoria categoria modalidade />  {/* dl: "Idade: 12 a 17 anos" · "Por grupo: mín. 4 · máx. Sem limite" (null → "Sem limite"; pendente → Skeleton) */}
    <p className="text-muted-foreground text-xs">{contagemIntegrantes(linhas.length)} na inscrição</p>
    <Button type="button" onClick={onCriar}><TicketIcon/>Criar inscrição</Button>
  </footer>
</section>
```
Picote (mesmo arquivo), a partir do SVG do usuário mas com tokens em vez de hex:
```tsx
function RecorteDoTicket() {
  return (
    <div aria-hidden="true" className="relative flex h-0 shrink-0 items-center">
      <Semicirculo className="absolute top-0 left-0 -translate-x-[1.5px] -translate-y-1/2" />
      <span className="border-border mx-3 flex-1 border-t border-dashed" />
      <Semicirculo className="absolute top-0 right-0 translate-x-[1.5px] -translate-y-1/2 rotate-180" />
    </div>
  );
}
function Semicirculo({ className }) {
  return (
    <svg width="6" height="12" viewBox="0 0 6 12" className={cn("fill-background stroke-border", className)}>
      {/* os dois paths do SVG fornecido, sem fill/stroke fixos; strokeWidth 1, strokeLinejoin round */}
    </svg>
  );
}
```
`h-0` + `-translate-y-1/2` põem o picote sobre a linha entre superfícies; o 1.5px cobre a borda da `section` (que **não** pode ter `overflow-hidden`); `fill-background`/`stroke-border` casam com a página.

### `bancada-inscricao-skeleton.tsx`
Fallback do portão com a geometria final: mesma grade; esquerda = `LadoDaBancada` com `Skeleton` no título/descrição/abas + `Skeleton h-10` (barra) + 4× `CartaoGrupoSkeleton`; direita = `TicketInscricaoSkeleton` (exportado de `ticket-inscricao.tsx`: cabeçalho, picote, vazio tracejado, picote, duas linhas + `Skeleton h-9`). `aria-busy` + `aria-label="Carregando a bancada de inscrição"`.

## Ordem de implementação
1. Extrair `PortaoDaEntidade` + layout apontando para ele (typecheck verde).
2. Slot `abas` + `ConteudoCartaoGrupo` (nada visível muda).
3. Filtros de grupos.
4. `selecao-inscricao.ts` → `use-inscricao.ts` → cartões → listas → coluna → ticket → skeleton → bancada.
5. Página.

## Verificação
```bash
yarn workspace @te-inscreve/nextjs typecheck
yarn workspace @te-inscreve/nextjs lint
yarn format
```
Navegador (`.claude/launch.json` → `web-attach` no :3000 do usuário, conforme memória): abrir `/admin/eventos/<id>/categorias/<id>/inscricoes/criar?modalidade=<id>` e conferir:
1. Trilha e "Criar Inscrição" pintam antes da bancada; esqueleto com a altura final (sem salto).
2. Cabeçalho esquerdo com nome da entidade e abas Grupos (ativa)/Integrantes sem linha dupla.
3. Rolar cada aba até o fim carrega mais páginas; trocar de aba e voltar mantém o filtro.
4. Busca por nome filtra na hora; "Filtros" abre com morph nas duas abas.
5. Escolher grupo → cartão marcado, ticket com "Grupo X", skeletons até `grupo.getById`, linhas com badge "Do grupo". Tirar uma → `integrantes_excluidos`; incluir avulso → `integrantes_incluidos`; trocar grupo → exclusões zeram, incluídos ficam; incluído que é membro aparece uma vez e não vai em `incluidos`; clicar grupo marcado → desmarca.
6. Pé do ticket com idade mín/máx e mín/máx por grupo ("Sem limite" para `null`); picotes alinhados nas bordas.
7. Tela estreita: ticket em cima, coluna da entidade embaixo. Conferir animações pelo DOM (o preview congela rAF, ver memória).
