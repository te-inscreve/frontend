# Animações

Este documento cobre uma técnica específica que o Te Inscreve usa em lugares
escolhidos da aplicação web: **um cartão ou linha de tabela que se expande até
virar um modal**, e encolhe de volta para o mesmo lugar ao fechar.

A biblioteca é o [Motion](https://motion.dev/docs/react), e o recurso é
[shared layout animations](https://motion.dev/docs/react-layout-animations#shared-layout-animations):
dois elementos em pontos diferentes da árvore compartilham um `layoutId`, e o
Motion anima a distância entre eles como se fossem o mesmo elemento mudando de
tamanho e de posição.

## 1. Por que existe

Um modal comum aparece do nada, no centro da tela. Quem clicou precisa refazer
sozinho a ligação entre o que clicou e o que abriu, e ao fechar precisa
reencontrar o item na lista.

Quando o modal é a **continuação de um item já visível**, a expansão elimina esse
trabalho: o item não desaparece nem é substituído — ele cresce. A posição de
origem fica óbvia, e o fechamento devolve o olho exatamente para onde ele estava.

Isso serve à experiência descrita em [DESIGN.md](DESIGN.md): fluxos que conduzem
até a próxima ação sem desorientar.

## 2. Quando usar — e quando não

**Use** quando o modal continua um item que está na tela:

- cartão de uma lista que abre o detalhe ou o formulário daquele item;
- linha de tabela que abre a edição da linha;
- atalho em forma de cartão que abre o cadastro que ele promete
  (`BotaoCriarCategoria` é o caso de referência).

**Não use** quando não há item de origem, ou quando a origem não é o assunto:

- confirmação destrutiva e avisos → `AlertDialog`;
- formulário aberto por um botão de barra ou de cabeçalho → `Dialog` comum
  (ex.: `DialogIntegrante`);
- conteúdo que substitui a tela inteira → uma rota.

Expandir tudo tira o significado da expansão. Se o modal não é aquele item,
é um `Dialog`.

## 3. Como usar

O primitivo é `ExpandableDialog`, em
`packages/components/src/components/expandable-dialog.tsx`, exportado por
`@te-inscreve/components`. Ele compõe o `Dialog` do Radix, então mantém foco
preso, `Esc`, clique fora e a semântica de diálogo.

```tsx
"use client";

const [aberto, setAberto] = useState(false);

<ExpandableDialog
    id={`criar-categoria-${modalidadeId}`}
    open={aberto}
    onOpenChange={setAberto}
>
    <ExpandableDialogTrigger className="…o cartão fechado…">
        <ExpandableDialogIcon>
            <PlusIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
        <ExpandableDialogLabel>Criar categoria</ExpandableDialogLabel>
    </ExpandableDialogTrigger>

    <ExpandableDialogContent>
        <ExpandableDialogHeader>
            <div className="flex items-center gap-3">
                <ExpandableDialogIcon>
                    <PlusIcon aria-hidden="true" weight="bold" />
                </ExpandableDialogIcon>
                <ExpandableDialogTitle>Criar categoria</ExpandableDialogTitle>
            </div>
            <ExpandableDialogDescription>
                A categoria entra na modalidade e passa a receber inscrições.
            </ExpandableDialogDescription>
        </ExpandableDialogHeader>

        <ExpandableDialogBody>{/* o formulário */}</ExpandableDialogBody>
    </ExpandableDialogContent>
</ExpandableDialog>;
```

Três regras de uso:

- **`id` único na tela.** É dele que saem os `layoutId`. Em uma lista, derive-o
  do item (`criar-categoria-${modalidadeId}`); dois itens com o mesmo `id` fazem
  o modal sair do cartão errado.
- **A abertura é controlada.** `open` e `onOpenChange` são obrigatórios: sem
  saber que o modal saiu, não há como animá-lo de volta.
- **Repita `ExpandableDialogIcon` e `ExpandableDialogLabel` nos dois lados.** São
  eles que dão a leitura de "o mesmo elemento cresceu". Sem esse par de âncoras,
  o morph vira só uma caixa mudando de tamanho. Todo o resto — descrição,
  formulário — é conteúdo novo e entra em opacidade.
- **E repita no mesmo tamanho.** Quem cresce no morph é a caixa; as peças
  compartilhadas não. O Motion anima um elemento compartilhado escalando a
  caixa dele, e escala aplicada a texto é literalmente letra esticada — o
  sintoma é o nome se espalhando na horizontal no meio da animação.

    Foi o defeito real da primeira versão do detalhe de integrante, medido no
    navegador: o rótulo ia de `547×20` em 14px na linha para `158×28` em 18px no
    modal, e o avatar de 36 para 44. Com os dois lados no mesmo tamanho
    (`450×20`, 14px, avatar 36), a escala é 1 e não há o que esticar.

    Na prática, o cabeçalho do modal é a linha — mesmo tamanho de fonte, mesmo
    avatar, mesmo `flex-1`. É também o que o exemplo de referência do Motion faz:
    no card e no modal, a imagem é `56×56` e o título usa a mesma classe.

## 4. As armadilhas

Estas cinco decisões parecem estranhas e não são: cada uma
resolve um jeito conhecido de a animação quebrar. Vale ler antes de "consertar"
alguma delas.

1. **`AnimatePresence` + `forceMount`, e não o desmonte do Radix.** O Radix tira
   o conteúdo da árvore no instante do fechamento, o que mataria a animação de
   volta. Por isso `Portal` e `Content` levam `forceMount` e quem decide a
   montagem é o `{open && …}` dentro do `AnimatePresence`.

2. **O modal não reaproveita o `DialogContent`.** Aquele centraliza com
   `translate-x-[-50%] translate-y-[-50%]` e anima com `data-[state=open]:zoom-in-95`
   — os dois escrevem no `transform`, que é exatamente onde o Motion projeta o
   morph. Aqui a centralização é de um grid `fixed inset-0 grid place-items-center`
   por fora, e o `transform` é só do Motion.

3. **`borderRadius` em `style`, nunca em classe.** O Motion contra-escala o raio
   quadro a quadro enquanto a caixa muda de proporção; se o raio vier de uma
   classe do Tailwind ele não tem o que ajustar, e as quinas achatam no meio do
   caminho.

4. **Nenhuma `transition` de CSS sobre `transform` no gatilho.** O Motion
   reescreve o `transform` a cada quadro; se o elemento tiver
   `transition: all`, o navegador passa a interpolar essas escritas com a
   duração dele por cima. As duas animações disputam a mesma propriedade e o
   resultado é o gatilho ficando para trás do modal — lê-se como duas animações
   soltas em vez de uma.

    A armadilha mora no `buttonVariants` do shadcn, que traz `transition-all`:
    todo gatilho que reaproveita o visual de botão precisa de um
    `transition-colors` depois dele (ver `BotaoEditarCategoria`). Para conferir,
    `getComputedStyle(gatilho).transitionProperty` não pode conter `all` nem
    `transform`.

5. **`layoutScroll` em todo ancestral rolável.** O Motion mede posições em
   coordenadas de viewport e não sabe sozinho que um contêiner rolou. Sem esse
   aviso, o modal nasce deslocado assim que a lista está fora do início — é o que
   `HorizontalScrollList` (`apps/web/src/shared/ui/horizontal-scroll-list.tsx`)
   passa para a `motion.div` que rola.

## 5. Movimento reduzido

O primitivo roda dentro de um `MotionConfig reducedMotion="user"`: com
`prefers-reduced-motion` ligado no sistema, o Motion descarta as animações de
transform e o modal simplesmente aparece, sem morph. Nada mais precisa ser feito
por quem usa o componente — mas vale testar nesse modo, porque é nele que erros
de layout aparecem sem a animação para disfarçar.

## 6. Onde já está em uso

- `apps/web/src/features/eventos/evento-detail/botao-criar-categoria.tsx` — o
  atalho tracejado no fim da fila de categorias vira o formulário de criar
  categoria.
- `apps/web/src/features/entidades/integrantes/linha-integrante.tsx` — a linha
  da listagem de integrantes vira o detalhe da pessoa.
- `apps/web/src/features/categorias/categoria-detail/botao-editar-categoria.tsx`
  — o botão "Editar" do detalhe da categoria vira o formulário de edição.

Nos três casos o formulário deixou de ser rota: criar, editar categoria e ver
integrante acontecem sobre a tela que já estava aberta.

## 7. Linha de tabela: as duas coisas a mais

A linha de listagem tem duas particularidades que o cartão não tem, e o
integrante é o exemplo delas.

**O raio muda no caminho.** A linha é uma faixa de ponta a ponta, sem cantos; o
modal é arredondado. O `radius` do root vale para o modal, e o gatilho passa
`style={{ borderRadius: 0 }}` por cima — o Motion anima a diferença, e o
arredondado vira parte do morph em vez de um corte seco.

**O cabeçalho do modal é a linha, do mesmo tamanho.** Ver a segunda regra da
seção 3 — é aqui que ela aparece com mais força, porque a caixa muda de 60px
para ~530px de altura e qualquer diferença de tamanho nas peças compartilhadas
vira deformação visível.

**O gatilho é um `button`, e `button` só aceita conteúdo de frase.** Nada de
`div` ou `p` lá dentro: use `span` com `block`/`flex`. Caixa de seleção então é
proibida — se a linha também precisa marcar, isso é um modo à parte, com outra
renderização, como em `LinhaIntegrante`.
