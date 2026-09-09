# First Contentful Paint

Este documento define um princípio que vale para **toda tela da aplicação web**:
o clique muda a tela na hora, e o conteúdo entra quando estiver pronto.

**FCP** (First Contentful Paint) é a métrica que mede quanto tempo passa até o
primeiro pixel de conteúdo aparecer. Ela não mede quando a página termina de
carregar — mede quando ela **começa a existir** para quem está olhando.

A aplicação já segue esse padrão em quase todo lugar. O que faltava era a regra
escrita: até aqui, o raciocínio vivia repetido em JSDoc de arquivo em arquivo, e
cada tela nova precisava redescobri-lo.

## 1. Por que existe

Uma tela em branco não comunica nada. Quem clicou não sabe se o clique
funcionou, se a rede caiu ou se o sistema travou — e a única coisa que resta é
esperar sem informação. Duzentos milissegundos assim já são perceptíveis;
oitocentos são o suficiente para alguém clicar de novo.

O erro que produz essa tela branca é quase sempre o mesmo: **algo que não depende
de rede ficou preso atrás de algo que depende**. O cabeçalho, a sidebar, o botão
de voltar e o título da página estão prontos desde o primeiro byte, mas o
componente espera a resposta da API antes de devolver qualquer JSX — e leva os
quatro junto.

O princípio corrige isso invertendo a ordem: **primeiro pinta tudo o que já se
sabe; o resto chega depois, por streaming.** A tela responde imediatamente, e a
espera fica confinada ao pedaço que realmente depende do servidor.

Isso serve à experiência descrita em [DESIGN.md](DESIGN.md) — um produto
"intuitivo, confiável e **ágil**", com "fluxos simples que conduzam o usuário até
a próxima ação". Uma tela branca não conduz ninguém a lugar nenhum.

## 2. A regra

- **Nenhum `await` no corpo de um `page.tsx` ou `layout.tsx`.**
- A página é `function`, não `async function`. `params` e `searchParams` são
  Promises no Next 16 e saem de `use(Promise.all([params, searchParams]))`, que
  não torna o componente assíncrono.
- Toda espera desce para um Server Component assíncrono atrás do **seu próprio**
  `<Suspense>`.
- Um `await` em `layout.tsx` é o pior caso: ele segura todas as rotas abaixo
  dele, não só a atual.

## 3. A receita

`apps/web/src/app/admin/eventos/[slug]/page.tsx` é o exemplo canônico. Vale ler
inteiro antes de escrever uma tela nova:

```tsx
export default function EventoDetailPage({ params, searchParams }: Props) {
    // 1. `use()` em vez de `await`: a página continua síncrona.
    const [{ slug }, query] = use(Promise.all([params, searchParams]));
    const idEvento = parseInteger(slug);
    const idModalidade = parseInteger(query.modalidade);

    if (!idEvento) notFound();

    // 2. `void prefetch`: dispara a requisição e segue em frente.
    void prefetch(trpc.evento.getById.queryOptions({ id: idEvento }));

    if (idModalidade) {
        void prefetch(trpc.modalidade.getById.queryOptions({ ... }));
    }

    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            {/* 3. A casca: não depende de rede, então pinta na hora. */}
            <div className="flex items-start justify-between gap-3">
                <GoBackButton href="/admin/eventos" />
                <AcoesEvento eventoId={idEvento} />
            </div>

            {/* 4. Só isto espera. */}
            <Suspense fallback={<DetalheEventoSkeleton />}>
                <DetalheEvento id={idEvento} modalidadeAtiva={idModalidade} />
            </Suspense>
        </div>
    );
}
```

### `prefetch` + `fetchQuery` são a mesma requisição

Este é o ponto menos óbvio da receita. A página dispara `void prefetch(...)` sem
esperar; o filho suspenso faz `await getQueryClient().fetchQuery(...)` com as
mesmas `queryOptions`. Parece requisição duplicada — não é.

`getQueryClient` é `cache()`ado por request
([`shared/api/trpc/server.tsx`](../apps/web/src/shared/api/trpc/server.tsx)),
então página e filho pegam o **mesmo** query client. O `fetchQuery` do filho
encontra a query já em voo e apenas aguarda a promise que o `prefetch` começou.
O `DetalheEvento` diz isso no próprio JSDoc:

> O `fetchQuery` reaproveita o `prefetch` disparado pela página: o query client
> é `cache`ado por request, então aqui só se aguarda a promise já em voo.

O que faz o resultado chegar por streaming em vez de bloquear é o
`shouldDehydrateQuery` de
[`query-client.ts`](../apps/web/src/shared/api/trpc/query-client.ts), que inclui
`query.state.status === "pending"`: queries **ainda pendentes** são serializadas
e mandadas para o cliente, que as completa quando a resposta chega.

Consequência prática: dispare o `prefetch` o mais cedo possível — no topo da
página, antes do JSX — para que a requisição corra em paralelo com a renderização
da casca em vez de começar só quando o filho for renderizado.

## 4. Granularidade dos boundaries

Um `<Suspense>` por **unidade de espera independente**, não um por página. Três
formas, todas em uso:

**Boundaries irmãos.** Em
`app/admin/eventos/[slug]/categorias/[slugCategoria]/page.tsx`, a trilha e o
detalhe têm boundaries separados. Uma requisição lenta do evento não segura o
detalhe da categoria, e vice-versa:

```tsx
<Suspense fallback={<TrilhaEventoSkeleton />}>
    <TrilhaCategoria ... />
</Suspense>

<Suspense fallback={<DetalheCategoriaSkeleton />}>
    <DetalheCategoria ... />
</Suspense>
```

**Boundary aninhado e keyed.** Em `features/eventos/evento-detail/detalhe-evento.tsx`,
o cabeçalho e as abas do evento pintam antes do corpo da aba. A `key` não é
detalhe: sem ela o React reaproveita o conteúdo da aba anterior e a troca fica
**parada** até a resposta chegar, em vez de mostrar o esqueleto.

```tsx
<Suspense key={ativa.id} fallback={<DetalheModalidadeSkeleton />}>
    <DetalheModalidade ... />
</Suspense>
```

**Boundary do tamanho de um pedaço só.** `features/usuarios/components/user-dropdown.tsx`
envolve apenas a foto do avatar, com o mesmo avatar sem foto como fallback — o
topbar pinta completo e a imagem entra depois, sem mover nada.
`shared/ui/admin-sidebar/sub-itens.tsx` usa `fallback={null}` pelos subitens da
sidebar.

Daí a regra derivada: **o boundary fica o mais fundo possível.** Se ele sobe, ele
leva junto tudo o que está dentro dele. O JSDoc de
`app/admin/minha-entidade/layout.tsx` descreve exatamente o que se ganha ao
mantê-lo fundo:

> Sem ele, a espera pelo perfil subiria até o boundary mais próximo — que fica
> _acima_ do layout do `/admin` — e seguraria a sidebar e o header junto com a
> página.

## 5. Fallbacks

**O fallback tem a geometria do conteúdo final** — mesma altura, mesmo número de
linhas, mesma largura de coluna. Um fallback menor que o conteúdo faz o layout
pular quando a resposta chega, e a espera visível vira duas: a do carregamento e
a do salto.

O primitivo é `Skeleton`, em
`packages/components/src/components/skeleton.tsx`, exportado por
`@te-inscreve/components`. Skeletons compostos ficam **ao lado da feature**, não
no pacote compartilhado — `detalhe-evento-skeleton.tsx`,
`detalhe-categoria-skeleton.tsx`, `painel-entidade-skeleton.tsx`, ou colocados no
mesmo arquivo do componente que substituem (`shared/ui/trilha-evento.tsx`).

Vale a regra de [DESIGN.md](DESIGN.md#13-movimento): **skeletons representam
carregamento de estrutura; spinners representam uma ação localizada em
andamento.** Carregar uma lista é estrutura — é skeleton. Salvar um formulário é
ação — é spinner no botão.

Quando o conteúdo entra sem empurrar nada e a espera é curta, `fallback={null}` é
legítimo: é o caso dos subitens da sidebar, que são o último grupo da lista.
Linhas cinzas que piscam para sumir logo em seguida são pior que nada.

## 6. Navegação

Use `<Link>` de **`next/link`** e deixe o prefetch padrão do Next fazer o
trabalho. Não passe `prefetch` explícito sem um motivo medido.

Quando o conteúdo vem do servidor, **navegue por URL em vez de estado de
cliente**. As abas de `detalhe-evento.tsx` são `<Link replace scroll={false}>`
com `<Tabs activationMode="manual">`: trocar de aba re-renderiza a árvore do
servidor e passa pelo boundary keyed, mostrando o esqueleto. Com estado de
cliente, a mesma troca congelaria na aba antiga até a resposta chegar.

Depois de uma mutação, invalide o Data Cache com as ações de
[`shared/api/revalidar.ts`](../apps/web/src/shared/api/revalidar.ts) e chame
`router.refresh()` — não recarregue a página.

## 7. A variante cliente

Quando o miolo precisa ser `"use client"`, o princípio é o mesmo, com hidratação
no lugar do streaming de RSC: `void prefetch` na página, `<HydrateClient>` em
volta e `useQuery` no filho. O exemplo é `app/admin/eventos/page.tsx` — título,
busca e o botão "Novo evento" são HTML de servidor e pintam na hora; só a grade
depende de dados.

```tsx
void prefetch(trpc.evento.getAll.queryOptions({ search }));
// ...
<HydrateClient>
    <ListaEventos />
</HydrateClient>;
```

Prefira o Server Component suspenso quando o conteúdo não precisa de
interatividade: ele chega já renderizado, sem custo de JS no cliente.

## 8. Exceções legítimas

Três casos justificam um `await` no corpo da página, e todos já estão anotados
por comentário no código. Ao usar um deles, **escreva o porquê ali mesmo** — sem
o comentário, a próxima pessoa lê como descuido.

**`defaultValues` de formulário.** O formulário precisa dos valores atuais para
montar. Não dá para servir uma casca e preencher depois sem que o campo pule ou
perca o que o usuário já digitou —
`app/admin/eventos/[slug]/editar/page.tsx`.

**Portão que decide se a página existe.** `app/admin/minha-entidade/layout.tsx`
decide, pelo vínculo do perfil, se a rota mostra a entidade ou o pedido de
acesso. Aqui o esqueleto cobre a página inteira, e isso é correto: não dá para
pintar conteúdo antes de saber se ele deve aparecer.

**Leitura de `cookies()`.** `app/admin/layout.tsx` aguarda o cookie do estado da
sidebar para evitar um flash pós-hidratação. Não há rede envolvida, o custo é
desprezível.

E o padrão a seguir quando uma exceção se aplica: **ela justifica um `await`, não
a página inteira.** `app/admin/eventos/[slug]/modalidades/[slugModalidade]/editar/page.tsx`
é o híbrido bem-feito — espera a modalidade porque precisa dela para os
`defaultValues`, mas dispara `void prefetch` do evento e deixa a trilha chegar
por streaming atrás do próprio boundary.

## 9. Débitos conhecidos

Telas que ainda contrariam o princípio. Listadas para que não sejam lidas como
padrão da casa.

| Onde   | Problema                                                                                                                                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/` | Não existe nenhum `loading.tsx` nem `error.tsx`. O JSDoc de `cabecalho-minha-entidade.tsx` cita um `error.tsx` que nunca foi criado, então erros de servidor caem na página de erro padrão do Next em vez de uma tela do produto. `not-found.tsx` e `forbidden.tsx` existem e funcionam. |
