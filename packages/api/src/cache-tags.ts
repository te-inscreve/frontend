/**
 * As tags de cache das leituras, num lugar só.
 *
 * Os `fetch` dos routers guardam a resposta por 30 segundos no Data Cache do
 * Next, e quem muda um recurso precisa derrubar exatamente as tags que a
 * leitura usou — senão o `router.refresh()` da tela repinta com a resposta
 * antiga e o objeto recém-criado não aparece.
 *
 * Enquanto as tags eram literais espalhados pelos routers e reescritos à mão
 * do lado das Server Actions, os dois lados divergiam em silêncio: a
 * revalidação do evento não conhecia `modalidade-*` nem `categorias`, e a
 * categoria nova ficava invisível. Aqui as duas pontas leem da mesma fonte.
 */

/**
 * As tags soltas, para quem revalida.
 *
 * Um `fetch` cai por **qualquer** uma das suas tags, então derrubar
 * `tagModalidadesDoEvento(3)` atinge tanto a lista de modalidades do evento 3
 * quanto o detalhe de cada uma delas. Quem revalida deve escolher sempre a tag
 * mais estreita que cobre a leitura: as amplas — `"eventos"`, `"modalidades"`,
 * `"categorias"` — valem para todos os eventos de uma vez, e só fazem sentido
 * quando a mudança é mesmo de listagem.
 */
export const tagEvento = (eventoId: number) => `evento-${eventoId}`;

export const tagModalidadesDoEvento = (eventoId: number) =>
    `evento-${eventoId}-modalidades`;

export const tagModalidade = (modalidadeId: number) =>
    `modalidade-${modalidadeId}`;

export const tagCategoriasDaModalidade = (modalidadeId: number) =>
    `modalidade-${modalidadeId}-categorias`;

export const tagCategoria = (categoriaId: number) => `categoria-${categoriaId}`;

export const tagInscricoesDaCategoria = (categoriaId: number) =>
    `categoria-${categoriaId}-inscricoes`;

export const tagFichaDaCategoria = (categoriaId: number) =>
    `categoria-${categoriaId}-ficha-avaliativa`;

export const tagResultadosDaCategoria = (categoriaId: number) =>
    `categoria-${categoriaId}-resultados`;

/**
 * Os conjuntos que cada leitura grava, do geral para o específico — é o que
 * vai no `next: { tags }` de cada `fetch`.
 */
export const tagsEventos = () => ["eventos"];

export const tagsEvento = (eventoId: number) => [
    ...tagsEventos(),
    tagEvento(eventoId),
];

export const tagsModalidades = (eventoId: number) => [
    "modalidades",
    tagModalidadesDoEvento(eventoId),
];

export const tagsModalidade = (eventoId: number, modalidadeId: number) => [
    ...tagsModalidades(eventoId),
    tagModalidade(modalidadeId),
];

export const tagsCategorias = (modalidadeId: number) => [
    "categorias",
    tagCategoriasDaModalidade(modalidadeId),
];

export const tagsCategoria = (modalidadeId: number, categoriaId: number) => [
    ...tagsCategorias(modalidadeId),
    tagCategoria(categoriaId),
];

export const tagsInscricoes = (categoriaId: number) => [
    "inscricoes",
    tagInscricoesDaCategoria(categoriaId),
];

export const tagsFichaDaCategoria = (categoriaId: number) => [
    tagFichaDaCategoria(categoriaId),
];

/**
 * A classificação também leva a tag do detalhe da categoria: ela só sai do
 * vazio quando a categoria é encerrada, e quem encerra já derruba essa tag.
 */
export const tagsResultadosDaCategoria = (categoriaId: number) => [
    tagCategoria(categoriaId),
    tagResultadosDaCategoria(categoriaId),
];

export const tagsEntidades = () => ["entidades"];

/**
 * O perfil do usuário da sessão.
 *
 * A tag é uma só para todo mundo, e não por usuário: derrubá-la invalida a
 * entrada de todas as sessões de uma vez. É o lado barato de errar — cada uma
 * refaz uma leitura —, e evita ter que carregar o id do usuário até aqui.
 */
export const tagsPerfil = () => ["perfil"];

export const tagsFichasAvaliativas = (id?: number) => [
    "fichas-avaliativas",
    `ficha-avaliativa-${id}`,
];
