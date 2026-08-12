# Design do Te Inscreve

Este documento define a direção de experiência e identidade visual do Te Inscreve. Ele deve orientar decisões de produto, design e implementação nas aplicações web e mobile.

O objetivo não é congelar uma biblioteca visual completa neste estágio do projeto. As regras abaixo criam uma linguagem comum para que novas telas pareçam pertencer ao mesmo produto e possam evoluir sem perder consistência.

## 1. Sobre o produto

O Te Inscreve é um conjunto de aplicações que facilita a inscrição e a apresentação de artistas em eventos tradicionais do Rio Grande do Sul, Brasil.

A solução atende dois contextos principais:

- **Aplicação web:** usada principalmente em computadores de escritório por organizadores de eventos e entidades tradicionalistas.
- **Aplicação mobile:** usada principalmente em celulares por avaliadores durante os eventos, muitas vezes em situações que exigem atenção, velocidade e segurança.

O produto está organizado em cinco grandes áreas:

1. **Eventos:** criação de eventos, modalidades e categorias de apresentação.
2. **Entidades:** gestão de entidades tradicionalistas, organizadores, artistas e grupos artísticos.
3. **Usuários:** gestão de acessos dos usuários às entidades.
4. **Inscrições:** vínculo de artistas ou grupos artísticos às categorias de um evento.
5. **Avaliações:** configuração de modelos avaliativos e avaliação das apresentações em tempo real.

## 2. Visão da experiência

Quando alguém abre o Te Inscreve, o produto deve parecer **intuitivo, confiável e ágil**, nunca confuso ou desorientador.

A experiência deve combinar:

- a organização e precisão de uma ferramenta profissional;
- a energia visual de cartazes de festival e competição;
- elementos da cultura tradicionalista usados com sutileza;
- fluxos simples que conduzam o usuário até a próxima ação.

O Te Inscreve não é uma rede social, um software administrativo genérico nem um aplicativo infantil. A identidade deve ser própria, reconhecível e adequada a um contexto cultural, sem transformar tradição em decoração excessiva.

## 3. Público e necessidades

### Organizadores e entidades

Trabalham principalmente na aplicação web. Precisam configurar eventos, administrar pessoas, inscrições e permissões com clareza. Podem lidar com grande volume de informações, mas a interface não deve despejar toda essa complexidade de uma só vez.

Necessidades principais:

- saber rapidamente o estado de um evento;
- encontrar pendências e próximas ações;
- configurar estruturas complexas em etapas compreensíveis;
- evitar erros em inscrições e permissões;
- ter confiança de que as alterações foram salvas.

### Avaliadores

Trabalham principalmente na aplicação mobile, durante apresentações. O ambiente pode ter distrações, pouco tempo, conexão instável e necessidade de operar o aparelho com uma mão.

Necessidades principais:

- identificar sem ambiguidade artista, grupo e categoria;
- avaliar com poucos toques;
- entender o que já foi preenchido e o que falta;
- salvar ou preservar o trabalho imediatamente;
- confirmar o envio sem interromper o ritmo da avaliação.

## 4. Princípios de design

### 4.1 Clareza antes de densidade

Mostrar primeiro a informação necessária para a decisão atual. Informações secundárias devem aparecer por hierarquia visual, expansão ou navegação contextual, não como uma tabela extensa por padrão.

### 4.2 Próxima ação evidente

Cada tela deve deixar claro onde o usuário está, o que está acontecendo e qual é a ação principal. Evitar grupos de botões com o mesmo peso visual.

### 4.3 Complexidade em etapas

Formulários longos devem ser divididos em seções, etapas ou fluxos guiados. A criação de um evento, inscrição ou modelo avaliativo deve indicar progresso e permitir revisão antes da confirmação.

### 4.4 Confiança visível

O sistema deve comunicar estados de salvamento, sincronização, validação e envio. Ações destrutivas precisam de contexto e confirmação proporcionais ao risco. Mensagens devem explicar como corrigir o problema.

### 4.5 Agilidade operacional

Ações frequentes devem exigir poucos passos. Preservar dados já informados, oferecer padrões úteis e evitar perguntas que o sistema possa responder pelo contexto.

### 4.6 Tradição como identidade, não ornamento

A cultura gaúcha deve aparecer em detalhes gráficos, linguagem editorial, imagens e momentos de celebração. Não usar texturas, símbolos ou regionalismos em todas as superfícies.

### 4.7 Celebração com propósito

Animação e expressividade são apropriadas para lançamento de eventos, inscrição concluída, avaliação enviada e resultados. Fluxos administrativos devem permanecer calmos e concentrados.

## 5. Personalidade da marca

O Te Inscreve deve transmitir:

- **Confiança:** estados claros, linguagem precisa e comportamento previsível.
- **Agilidade:** fluxos curtos, respostas imediatas e boa hierarquia.
- **Animação:** energia de evento e competição nos momentos certos.

A personalidade é moderna, segura, acolhedora e ligada à cultura tradicionalista. Não é fria, corporativa, caricata, nostálgica ou infantil.

### Tom de voz

Os textos devem ser diretos e profissionais, em português do Brasil.

- Preferir verbos claros: “Criar evento”, “Salvar avaliação”, “Enviar inscrição”.
- Usar frases curtas e vocabulário conhecido pelo público.
- Nomear conceitos da forma como entidades e eventos tradicionalistas os conhecem.
- Explicar consequências antes de ações irreversíveis.
- Em erros, dizer o que aconteceu e como prosseguir.
- Usar regionalismos somente quando forem naturais ao contexto, nunca como caricatura.
- Evitar entusiasmo artificial, excesso de exclamações e mensagens infantilizadas.

Exemplos:

- Bom: “Avaliação salva. Você pode continuar mesmo se a conexão oscilar.”
- Bom: “Faltam 2 critérios para enviar a avaliação.”
- Evitar: “Oba! Mais uma notinha campeã! 🎉”
- Evitar: “Erro inesperado.” sem orientação adicional.

## 6. Direção visual

A referência conceitual são **cartazes contemporâneos de festival e competição**, traduzidos para uma interface de produto digital.

Isso significa usar:

- títulos fortes e composições com hierarquia marcante;
- cor e elementos gráficos em cabeçalhos, destaques e celebrações;
- cards que lembrem programações, credenciais ou inscrições;
- números, categorias e status com leitura rápida;
- ritmo visual e contraste, mantendo o conteúdo operacional limpo.

Não significa reproduzir literalmente papel envelhecido, madeira, couro, metal, bandeiras ou ornamentos tradicionalistas. Essas referências podem inspirar formas e detalhes, mas não devem comprometer legibilidade ou modernidade.

### Regra de equilíbrio

Superfícies de trabalho devem ser majoritariamente neutras. A personalidade aparece nos pontos de orientação e significado: navegação, títulos, estados, ilustrações, destaques e conclusões de fluxo.

## 7. Cores

A cor principal da marca é:

```css
--primary: oklch(0.5751 0.1317 139.6817);
```

Ela deve representar avanço, confirmação e identidade. Usos recomendados:

- ação principal;
- item ativo na navegação;
- foco de campos;
- indicadores de progresso;
- destaques de marca;
- estados positivos quando o significado estiver claro.

Evitar grandes áreas verdes em telas operacionais. O uso excessivo reduz a hierarquia e faz todas as ações parecerem igualmente importantes.

### Paleta de apoio

A paleta deve combinar o verde principal com:

- fundos claros levemente aquecidos;
- superfícies brancas;
- texto quase preto, sem preto absoluto;
- cinzas ou neutros suavemente quentes;
- vermelho reservado a erros, riscos e ações destrutivas;
- tons quentes inspirados no lenço vermelho e nos detalhes dourados do mascote, usados apenas como acentos editoriais ou festivos.

Os acentos vermelho e dourado não devem competir com o verde nas ações principais. Todo uso de cor precisa manter contraste compatível com WCAG AA.

### Tema

O modo claro é o padrão e a única experiência planejada neste momento. Os tokens devem continuar semânticos para permitir um modo escuro no futuro, mas novas telas não precisam projetá-lo ou testá-lo agora.

## 8. Tipografia

A tipografia deve ser contemporânea, legível e funcional.

- Usar uma fonte sans-serif de alta legibilidade para interface e conteúdo.
- Usar peso e tamanho, não muitas famílias tipográficas, para criar hierarquia.
- Títulos de páginas e momentos editoriais podem ser mais fortes e compactos, evocando cartazes de competição.
- Textos operacionais, formulários e avaliações devem ser sóbrios.
- Evitar fontes manuscritas, western, excessivamente decorativas ou que imitem cartazes antigos.
- Números de notas, ordem de apresentação e resultados devem ter excelente diferenciação e alinhamento.

A fonte Geist já presente no projeto é uma base adequada para a interface. Uma fonte adicional só deve ser adotada se trouxer uma identidade editorial clara sem prejudicar desempenho e legibilidade.

## 9. Forma, superfícies e ícones

### Formas e cards

- Usar cantos moderadamente arredondados, alinhados ao token atual de `0.75rem`.
- Preferir bordas sutis e separação por espaço antes de sombras fortes.
- Reservar sombras para superfícies elevadas, menus, diálogos e cards interativos.
- Cards devem agrupar uma unidade com significado, não envolver todo bloco de conteúdo por hábito.
- Variações especiais de cards podem lembrar uma credencial ou ficha de competição por meio da composição, não de decoração literal.

### Ícones

- Manter Phosphor como família principal enquanto ela atender às necessidades do produto.
- Usar um único estilo por contexto; `duotone` pode destacar seleção, celebração ou elementos de marca.
- Ícones devem apoiar rótulos, não substituir palavras em ações pouco conhecidas.
- Símbolos tradicionalistas devem ser raros, contextuais e culturalmente corretos.

### Imagens e ilustrações

- Priorizar fotografias e ilustrações que representem apresentações, grupos, indumentária e eventos com respeito e autenticidade.
- Evitar bancos de imagem corporativos genéricos.
- Evitar uma mistura sem critério de ilustração 3D, fotografia, desenho plano e ícones decorativos.

## 10. Mascote

O Gauchinho é um recurso de marca, não um personagem constante da interface.

Usar o mascote em:

- login e onboarding;
- estados vazios importantes;
- conclusão ou celebração de fluxos relevantes;
- comunicação institucional da marca.

Não usar o mascote em:

- cabeçalhos de todas as páginas;
- controles, botões ou alertas rotineiros;
- formulários extensos;
- telas de avaliação em que possa distrair;
- mensagens de erro ou situações graves.

O tom das mensagens próximas ao mascote deve continuar profissional. Sua presença pode trazer acolhimento e identidade sem transformar o produto em uma experiência lúdica ou infantil.

Para navegação persistente, preferir uma marca gráfica simplificada e legível em tamanho pequeno. A ilustração completa não deve ser reduzida até perder detalhes.

## 11. Layout e navegação

### Aplicação web

A web é orientada a tarefas de escritório e deve aproveitar telas maiores sem aumentar desnecessariamente a densidade.

- Manter navegação principal estável e previsível.
- Exibir título, contexto e ação principal no início de cada página.
- Usar breadcrumbs quando houver mais de um nível de profundidade relevante.
- Construir páginas em torno de tarefas e estados, não em torno de tabelas do banco de dados.
- Oferecer busca e filtros quando a quantidade de itens justificar.
- Preservar filtros e contexto ao abrir e retornar de um item.
- Em páginas extensas, manter ações críticas acessíveis sem exigir rolagem de volta ao topo.

A página inicial administrativa deve priorizar eventos em andamento, pendências, inscrições recentes e próximas ações — não métricas decorativas.

### Aplicação mobile

A aplicação mobile deve funcionar bem sob pressão e com atenção dividida.

- Áreas de toque devem ter no mínimo 44 × 44 pontos.
- A ação principal deve ficar ao alcance do polegar quando apropriado.
- Evitar controles pequenos lado a lado.
- Mostrar progresso de preenchimento e estado de sincronização persistentemente.
- Não depender exclusivamente de gestos ocultos.
- Preservar avaliações localmente diante de conexão instável sempre que a arquitetura permitir.
- Antes do envio final, oferecer uma revisão rápida de critérios incompletos ou valores fora do esperado.

## 12. Componentes e padrões de interação

### Botões

- Uma ação primária por região da interface.
- Ações secundárias usam menor contraste.
- Ações destrutivas não usam a cor principal.
- O rótulo deve descrever a ação, evitando “OK”, “Sim” ou “Continuar” quando houver opção mais específica.
- Estados de carregamento devem preservar a largura e explicar o que está ocorrendo.

### Formulários

- Rótulos permanecem visíveis; placeholder não substitui label.
- Agrupar campos por assunto e revelar campos condicionais apenas quando necessários.
- Validar próximo ao campo e preservar os valores após erros.
- Indicar campos opcionais em vez de marcar visualmente todos os obrigatórios.
- Para fluxos longos, permitir salvar rascunho e retornar depois.
- Usar escolhas, padrões e preenchimento automático para reduzir digitação.

### Listas e tabelas

- Usar cards quando os itens têm identidade, imagem, estado e poucas ações principais.
- Usar tabelas quando a comparação entre colunas é a tarefa central.
- Não usar tabelas como padrão para toda entidade administrativa.
- Oferecer ações em lote apenas quando houver uma necessidade real e compreensível.
- Estados vazios devem explicar o valor da área e apresentar uma próxima ação.

### Status e feedback

- Todo status deve ter texto; cor sozinha não é suficiente.
- Usar vocabulário consistente: rascunho, publicado, inscrições abertas, inscrições encerradas, em avaliação, concluído, cancelado.
- Feedback de salvamento deve ser discreto e próximo da ação.
- Toasts servem para confirmações transitórias, não para informações que o usuário precisa consultar depois.
- Falhas de rede no mobile devem distinguir “não salvo”, “salvo neste aparelho” e “sincronizado”.

### Diálogos

Usar diálogos para decisões curtas, confirmações e pequenas edições contextuais. Não colocar fluxos longos ou formulários complexos dentro deles.

## 13. Movimento

O movimento deve reforçar continuidade, resposta e celebração.

- Usar transições breves em menus, seleção, progresso e mudanças de estado.
- Animações festivas podem aparecer após marcos importantes, de forma curta e não bloqueante.
- Não usar shimmer decorativo em títulos ou conteúdo estático.
- Skeletons representam carregamento de estrutura; spinners representam uma ação localizada em andamento.
- Respeitar `prefers-reduced-motion`.

## 14. Acessibilidade e uso real

Acessibilidade faz parte da confiança do produto.

- Buscar conformidade WCAG 2.2 AA.
- Garantir navegação completa por teclado na aplicação web.
- Manter foco visível e ordem de foco lógica.
- Associar labels, mensagens de erro e descrições aos campos.
- Não depender apenas de cor, posição ou animação para transmitir significado.
- Suportar zoom e tamanhos maiores de texto sem perda de ações.
- Usar linguagem compreensível e evitar abreviações sem explicação.
- Testar telas mobile em ambiente externo, com brilho variável e conectividade ruim.

## 15. O que evitar

### Aparência de rede social

Evitar feeds, contadores de popularidade, avatares como elemento dominante, reações, linguagem de engajamento e navegação inspirada em redes sociais quando não servirem à tarefa.

### Aparência de ERP genérico

Evitar menus profundos, telas compostas apenas por tabelas, excesso de filtros sempre visíveis, formulários com dezenas de campos em sequência e linguagem baseada na estrutura técnica dos dados.

### Aparência infantil

Evitar cores saturadas em excesso, recompensas constantes, mascote onipresente, cópia exageradamente brincalhona, confetes em tarefas rotineiras e componentes com proporções de aplicativo infantil.

### Tradicionalismo caricato

Evitar texturas pesadas, tipografia western, couro e madeira simulados, símbolos regionais usados sem contexto e frases estereotipadas. A tradição deve ser tratada com autenticidade e contenção.

## 16. Referências e como interpretá-las

As referências servem como princípios, não como modelos para cópia:

- **Uxcel:** hierarquia visual, experiência guiada e progresso compreensível.
- **Duolingo:** feedback imediato, fluxos claros e incentivo à continuidade — sem adotar sua estética infantil ou gamificação intensa.
- **Linear:** velocidade percebida, precisão, atalhos e estados bem definidos.
- **Notion:** composição limpa, conteúdo como protagonista e padrões previsíveis.

A linguagem de cartazes de festival e competição adiciona a identidade que diferencia o Te Inscreve dessas ferramentas.

## 17. Critérios para revisar uma tela

Antes de considerar uma tela pronta, verificar:

1. O usuário entende onde está sem depender de conhecimento prévio?
2. A ação principal é evidente?
3. A tela mostra apenas a complexidade necessária neste momento?
4. Estados de carregamento, vazio, erro e sucesso foram previstos?
5. O usuário sabe se seu trabalho foi salvo ou enviado?
6. A identidade do Te Inscreve aparece sem competir com a tarefa?
7. A tela parece uma ferramenta profissional, mas não um ERP genérico?
8. Os textos são diretos, específicos e orientam a próxima ação?
9. A experiência funciona com teclado na web e com uma mão no mobile?
10. Contraste, foco, tamanho de toque e redução de movimento foram considerados?

## 18. Decisões em aberto

Os seguintes pontos devem ser definidos conforme o sistema amadurecer:

- paleta completa e valores dos tokens semânticos;
- marca gráfica simplificada para navegação e favicon;
- regras fotográficas e biblioteca de ilustrações;
- escala tipográfica definitiva;
- experiência offline e estratégia de sincronização das avaliações;
- critérios e escopo de um futuro modo escuro;
- testes com organizadores e avaliadores em eventos reais.

Alterações significativas na linguagem visual ou nos princípios de experiência devem atualizar este documento antes de se tornarem um novo padrão no código.
