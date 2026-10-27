// Todo o conteúdo do diagnóstico fica aqui. Edite textos, alternativas, faixas e cortes sem mexer no código.

export type Etapa = "lead_reuniao" | "reuniao_proposta" | "proposta_venda";
export type CampoCompromisso = "numero" | "fonte" | "responsavel" | "revisao" | "decisao" | "conclusao";

export const config = {
  // O que aparece nas telas. Na aula, estes três ficam desligados: os cortes de maturidade ainda não foram
  // validados, a comparação margem contra gasto confunde sem a conta do mês e as medianas misturam definições.
  exibicao: { maturidade: false, margemContraGasto: false, conversaoMediana: false },

  // Aula ou evento em que o diagnóstico é usado. Aparece no topo das telas.
  evento: "G4 Traction",
  turmaPadrao: "g4-traction",

  // true: mostra a etapa de identificação (opcional, com consentimento). false: o diagnóstico é 100% anônimo.
  identificacaoAtiva: true,

  // Texto exibido quando o aluno preenche algum campo de identificação. Validar com a G4.
  consentimento:
    "Autorizo Breno Barbieri a guardar estas respostas junto com a minha identificação e a entrar em contato comigo sobre o resultado deste diagnóstico.",
  avisoIdentificacao:
    "Todos os campos desta etapa são opcionais. Sem se identificar, você faz o diagnóstico e recebe o seu resultado do mesmo jeito. Valores em reais e quantidades que você digitar depois ficam só neste aparelho.",

  faturamento: [
    "Até R$ 50 mil",
    "R$ 50 a 200 mil",
    "R$ 200 mil a R$ 1 milhão",
    "Acima de R$ 1 milhão",
  ],

  marcacoes: [
    { valor: "real", rotulo: "Real" },
    { valor: "estimado", rotulo: "Estimado" },
    { valor: "desconhecido", rotulo: "Não tenho como saber" },
  ],
  // Só aparece nos campos com "permiteNaoSeAplica". A etapa que depende do campo sai da comparação.
  marcacaoNaoSeAplica: { valor: "nao_se_aplica", rotulo: "Não se aplica ao meu negócio" },

  // Negócio misto: o aluno escolhe uma operação e responde todo o diagnóstico sobre ela.
  operacaoMista: {
    pergunta: "Você vende de mais de um jeito. Escolha uma operação e responda todo o diagnóstico pensando só nela.",
    opcoes: ["recorrente", "avulsa", "recompra"],
  },

  textos: {
    criterioEtapa:
      "Como a etapa prioritária é escolhida: é a etapa em que o resultado informado ficou proporcionalmente mais abaixo da expectativa que você mesmo informou, ou seja, (esperado menos informado) dividido pelo esperado. Não é referência de mercado e não comprova que ali está a restrição do seu negócio. Cadência e follow-up, qualificação e proposta de valor são hipóteses para investigar. A conversão sozinha não diz a causa.",
    funilMensal:
      "Use os números do último mês. Algumas vendas vêm de orçamentos de meses anteriores, então as comparações são aproximadas.",
    notaGastoComercial:
      "Este número não é CAC. O CAC exige contar só clientes novos e apenas os custos de aquisição compatíveis. Aqui o gasto comercial total do mês é dividido pelas vendas do mês, inclusive de clientes antigos.",
    alertaBase:
      "Há mais {posterior} do que {anterior}. Pode ser real, quando o mês recebe movimentos de períodos anteriores, ou pode ser erro de contagem. Confira a base.",
    expectativaRegua:
      "Sua resposta é a régua de comparação. Não é referência de mercado.",
  },

  // Bloco 0: contexto (não pontua)
  contexto: [
    {
      id: "pagamento",
      pergunta: "Como o cliente paga você?",
      opcoes: [
        {
          valor: "recorrente",
          rotulo: "Recorrente",
          leitura:
            "Retenção e cancelamento são o jogo. A etapa a investigar costuma ser o pós-venda.",
        },
        {
          valor: "avulsa",
          rotulo: "Venda avulsa ou projeto",
          leitura:
            "O jogo é volume e conversão. A etapa a investigar costuma ser o topo do funil.",
        },
        {
          valor: "recompra",
          rotulo: "Venda avulsa, mas o cliente volta a comprar",
          leitura:
            "O valor do cliente está na recompra. A conta certa compara o custo para conquistá-lo com tudo o que ele deixa ao longo das compras.",
        },
        {
          valor: "misto",
          rotulo: "Misto",
          leitura:
            "Separe qual parte paga as contas e qual é a aposta de crescimento.",
        },
      ],
    },
    {
      id: "evolucao",
      pergunta: "Como o faturamento evoluiu nos últimos 12 meses?",
      opcoes: [
        {
          valor: "caindo",
          rotulo: "Caindo",
          leitura: "Se o esforço é alto, o problema é eficiência do processo.",
        },
        {
          valor: "estavel",
          rotulo: "Estável",
          leitura: "Se o esforço é alto, o problema é eficiência do processo.",
        },
        {
          valor: "improviso",
          rotulo: "Crescendo no improviso",
          leitura: "A operação tende a quebrar com a escala.",
        },
        { valor: "processo", rotulo: "Crescendo com processo definido" },
      ],
    },
    {
      id: "quemVende",
      pergunta: "Quem vende hoje?",
      opcoes: [
        {
          valor: "dono",
          rotulo: "Só o dono",
          leitura: "A operação comercial está na cabeça de uma pessoa.",
        },
        { valor: "dono_mais", rotulo: "O dono e mais uma ou duas pessoas" },
        {
          valor: "time",
          rotulo: "Um time dedicado, sem o dono na linha de frente",
        },
      ],
    },
  ],

  // Bloco 1: percepção. "etapa" liga a resposta à etapa do funil.
  percepcao: {
    pergunta: "Onde você acha que mais perde cliente?",
    opcoes: [
      { valor: "topo", rotulo: "Não chega contato suficiente" },
      { valor: "lead_reuniao", rotulo: "O contato some ou para de responder" },
      {
        valor: "reuniao_proposta",
        rotulo: "Atende, mas não chega no orçamento ou na proposta",
      },
      { valor: "proposta_venda", rotulo: "Envia orçamento ou proposta e não fecha" },
      { valor: "nao_sei", rotulo: "Não sei" },
    ],
  },

  // Expectativa do próprio aluno por etapa (de 0 a 10). É a régua usada para apontar a etapa prioritária para investigar.
  expectativas: {
    titulo: "Antes dos números: o que você considera normal na sua empresa?",
    perguntas: {
      lead_reuniao: "De cada 10 contatos que chegam, quantos você espera que virem atendimento?",
      reuniao_proposta: "De cada 10 atendimentos, quantos você espera que virem orçamento ou proposta?",
      proposta_venda: "De cada 10 orçamentos ou propostas, quantos você espera fechar?",
    } as Record<Etapa, string>,
  },

  // false: as faixas abaixo não são usadas (estão provisórias). true: viram uma régua extra, mostrada no resultado.
  usarFaixas: false,

  // Blocos 2 e 3: campos numéricos. "somenteRecorrente" esconde o campo para venda avulsa.
  campos: [
    {
      id: "A", bloco: "funil", rotulo: "Quantos contatos ou leads chegaram?", unidade: "numero",
      ajuda: "Serviço ou venda para empresas: leads.",
      saibaMais: "Loja física: pessoas que entraram. E-commerce: visitas ao site.",
    },
    {
      id: "B", bloco: "funil", rotulo: "Quantos atendimentos ou conversas de venda aconteceram?", unidade: "numero",
      ajuda: "Reunião, visita, conversa de venda no WhatsApp ou atendimento na loja.",
      saibaMais: "E-commerce: carrinhos criados. Se o seu negócio não tem esta etapa, marque Não se aplica.",
      permiteNaoSeAplica: true,
    },
    {
      id: "C", bloco: "funil", rotulo: "Quantos orçamentos ou propostas foram enviados?", unidade: "numero",
      ajuda: "Se você vende sem orçamento ou proposta, marque Não se aplica.",
      saibaMais: "Vale para loja e e-commerce. Essa etapa fica fora da comparação.",
      permiteNaoSeAplica: true,
    },
    { id: "D", bloco: "funil", rotulo: "Quantas vendas foram fechadas?", unidade: "numero" },
    {
      id: "E", bloco: "economia", rotulo: "Ticket médio ou mensalidade média", unidade: "reais",
      ajuda: "Valor médio de cada venda no último mês, em reais.",
    },
    {
      id: "F", bloco: "economia", rotulo: "Margem de contribuição", unidade: "pct",
      ajuda: "Quanto sobra de cada venda, em %, depois de custo, impostos e comissão.",
      saibaMais:
        "A comissão entra aqui, uma vez só. Exemplo: R$ 1.000 de ticket × 30% de margem = R$ 300 por venda. Não é lucro líquido.",
    },
    {
      id: "G",
      bloco: "economia",
      rotulo: "Gasto comercial do mês",
      unidade: "reais",
      ajuda: "Salários de quem vende, ferramentas e anúncios do mês.",
      saibaMais:
        "Comissão só entra aqui se ainda não saiu da margem. Se você também vende, inclua a parte do seu pró-labore equivalente ao tempo de venda. Não inclua o custo de entregar o produto ou o serviço.",
    },
    { id: "H", bloco: "economia", rotulo: "Dias, em média, do primeiro contato ao fechamento", unidade: "dias" },
    { id: "I", bloco: "economia", rotulo: "Clientes ativos hoje", unidade: "numero", somenteRecorrente: true },
    { id: "J", bloco: "economia", rotulo: "Clientes que cancelaram no último mês", unidade: "numero", somenteRecorrente: true },
    { id: "K", bloco: "economia", rotulo: "Quantos meses, em média, um cliente fica", unidade: "meses", somenteRecorrente: true },
    { id: "L", bloco: "economia", rotulo: "Quantas vezes, em média, um cliente compra de você", unidade: "vezes", somenteRecompra: true },
  ] as {
    id: string;
    bloco: "funil" | "economia";
    rotulo: string;
    unidade: "numero" | "reais" | "pct" | "dias" | "meses" | "vezes";
    ajuda?: string;
    saibaMais?: string;
    permiteNaoSeAplica?: boolean;
    somenteRecorrente?: boolean;
    somenteRecompra?: boolean;
  }[],

  // Faixas de referência de conversão, em %.
  faixas: {
    // PLACEHOLDER: definir com o Breno
    lead_reuniao: {
      rotulo: "Contato para atendimento",
      formula: "B ÷ A",
      min: 20,
      max: 40,
      leituraAbaixo:
        "Hipóteses a investigar: falta de cadência e follow-up, ou contatos fora do perfil. A conversão sozinha não diz qual.",
    },
    // PLACEHOLDER: definir com o Breno
    reuniao_proposta: {
      rotulo: "Atendimento para orçamento",
      formula: "C ÷ B",
      min: 50,
      max: 70,
      leituraAbaixo:
        "Hipóteses a investigar: atendimento a quem não tem o perfil do cliente ideal, ou pouca qualificação antes do atendimento.",
    },
    // PLACEHOLDER: definir com o Breno
    proposta_venda: {
      rotulo: "Orçamento para venda",
      formula: "D ÷ C",
      min: 25,
      max: 45,
      leituraAbaixo:
        "Hipóteses a investigar: qualificação, proposta de valor ou preço. A conversão sozinha não diz qual.",
    },
  } as Record<
    Etapa,
    { rotulo: string; formula: string; min: number; max: number; leituraAbaixo: string }
  >,

  // Ações da semana seguinte, ligadas a cada leitura. PROPOSTA: validar com o Breno.
  acoes: {
    gargalo: {
      lead_reuniao:
        "Para testar a hipótese de cadência: defina um prazo máximo para responder cada contato e uma sequência de 3 a 5 contatos antes de desistir dele.",
      reuniao_proposta:
        "Para testar a hipótese de perfil: escreva em uma frase quem é o seu cliente ideal e use essa frase para decidir quem recebe atendimento e orçamento.",
      proposta_venda:
        "Para testar a hipótese de qualificação ou de proposta: pergunte a quem não fechou por que não fechou e anote o motivo. Antes do próximo orçamento, confirme que o cliente tem a necessidade, o dinheiro e quem decide.",
    } as Record<Etapa, string>,
    medirEtapa:
      "Os números das etapas {etapas} não eram reais, então não dá para definir a etapa prioritária para investigar. Comece a contar essas etapas toda semana no controle semanal e refaça o diagnóstico com 4 semanas de dados.",
    naoPagaAvulsa:
      "Separe o gasto comercial fixo (salários, ferramentas) do que varia com cada venda (anúncio por venda, por exemplo). Depois revise preço e margem de contribuição.",
    naoPagaVida:
      "Confira se o gasto comercial inclui só custos de aquisição e se as vendas do mês são de clientes novos. Converse com os últimos 5 clientes que pararam de comprar ou cancelaram.",
    churnSemDado:
      "Anote todo mês quantos clientes ativos você tem e quantos cancelaram.",
    cicloIncerto:
      "Nas próximas vendas, anote a data do primeiro contato e a data do fechamento.",
    medicao:
      "Use o controle semanal: 15 minutos por semana para anotar os números do funil.",
    dependencia:
      "Escreva o passo a passo do que a pessoa que mais vende faz, do primeiro contato ao fechamento.",
    gestao:
      "Comece com um ritual: 30 minutos por semana olhando o controle semanal com quem vende.",
  },

  // Controle semanal que o aluno leva da aula (rota /controle)
  controle: {
    titulo: "Controle semanal do comercial",
    instrucao:
      "Preencha toda semana, no mesmo dia. Leva 15 minutos. Depois de 4 semanas você terá números reais para refazer o diagnóstico.",
    colunas: [
      "Semana",
      "Contatos ou leads que chegaram",
      "Atendimentos ou conversas",
      "Orçamentos ou propostas enviados",
      "Vendas fechadas",
      "Valor vendido (R$)",
      "Gasto para gerar vendas (R$)",
      "Principal motivo de perda",
    ],
    semanas: 8,
  },

  leiturasEconomia: {
    naoPagaAvulsa:
      "O gasto comercial por venda ficou acima da margem de contribuição de uma venda. Isso não mostra que vender mais aumenta o prejuízo, porque parte desse gasto (salários, ferramentas) não cresce a cada venda. Indica que vale revisar preço, margem e gasto comercial.",
    naoPagaVida:
      "O gasto comercial por venda ficou acima da margem que o cliente deixa no tempo médio informado. Confira se o gasto inclui só custos de aquisição e se as vendas do mês são de clientes novos.",
    churnSemDado:
      "O principal risco do seu negócio está sem acompanhamento.",
    cicloIncerto:
      "Sem saber o ciclo, não dá para prever o faturamento.",
    naoCalculavel: "Não foi possível calcular.",
  },

  // Bloco 4: ponte com a aula anterior
  ponte: {
    rituais: {
      pergunta: "Quais rituais você roda hoje?",
      opcoes: [
        { valor: "reuniao_equipe", rotulo: "Reunião semanal de equipe" },
        { valor: "revisao_pipeline", rotulo: "Revisão semanal de pipeline" },
        { valor: "individual", rotulo: "Conversa individual com cada vendedor" },
        { valor: "mensal", rotulo: "Reunião mensal de resultados" },
        { valor: "nenhum", rotulo: "Nenhum" },
      ],
    },
    clienteIdeal: {
      pergunta: "Você consegue descrever em uma frase quem é o seu cliente ideal?",
      textoLabel: "Escreva a frase",
    },
    dependencia: {
      pergunta:
        "Se a pessoa que mais vende sair por uma semana, o que acontece?",
      opcoes: [
        { valor: "tudo_para", rotulo: "Tudo para ou eu preciso assumir", pontos: 0 },
        { valor: "dificuldade", rotulo: "Alguém assume com dificuldade", pontos: 1 },
        { valor: "tranquilidade", rotulo: "Outra pessoa assume com tranquilidade", pontos: 2 },
      ],
    },
  },

  // Síntese: hipóteses que o aluno escolhe para investigar (até 3). Não são causas comprovadas.
  gargalos: [
    "Geração de demanda",
    "Cadência e follow-up",
    "Qualificação e cliente ideal",
    "Proposta de valor",
    "Medição e números",
    "Dependência de pessoas",
    "Acompanhamento e gestão",
  ],
  gargaloPorEtapa: {
    lead_reuniao: "Cadência e follow-up",
    reuniao_proposta: "Qualificação e cliente ideal",
    proposta_venda: "Proposta de valor",
  } as Record<Etapa, string>,
  maxGargalos: 3,

  // Textos do painel da turma que não vêm de outras seções.
  painel: {
    empate: "Empate",
    empresaCada: "{qtd} empresa cada",
    empresasCada: "{qtd} empresas cada",
    notaPercepcao:
      "Contorno: onde a turma acha que perde mais. Cheio: etapa mais abaixo do que cada um esperava, só com números reais.",
  },

  // Textos da tela de resultado (devolutiva). Marcadores entre chaves, como {x}, são preenchidos pelo código.
  devolutiva: {
    etapas: {
      lead_reuniao: {
        seta: "contato → atendimento",
        itens: "contatos",
        proxima: "atendimento",
        motivos: "demora para responder, poucas tentativas de contato ou contatos fora do perfil.",
        acoes: [
          "Defina um prazo máximo para responder cada contato e uma sequência de 3 a 5 contatos antes de desistir dele.",
        ],
      },
      reuniao_proposta: {
        seta: "atendimento → orçamento",
        itens: "atendimentos",
        proxima: "orçamento",
        motivos: "atendimento a quem não tem perfil ou pouca qualificação antes de atender.",
        acoes: [
          "Escreva em uma frase quem é o seu cliente ideal e use essa frase para decidir quem recebe atendimento e orçamento.",
        ],
      },
      proposta_venda: {
        seta: "orçamento → venda",
        itens: "orçamentos",
        proxima: "venda",
        motivos: "o cliente não tinha perfil, a proposta não mostrou valor ou o preço.",
        acoes: [
          "Pergunte a quem não fechou por que não fechou e anote o motivo.",
          "Antes do próximo orçamento, confirme que o cliente tem a necessidade, o dinheiro e quem decide.",
        ],
      },
    } as Record<Etapa, { seta: string; itens: string; proxima: string; motivos: string; acoes: string[] }>,
    // Etapas como o aluno as escolhe na pergunta de percepção.
    setaPercepcao: {
      topo: "chegada de contatos",
      lead_reuniao: "contato → atendimento",
      reuniao_proposta: "atendimento → orçamento",
      proposta_venda: "orçamento → venda",
    } as Record<string, string>,
    diagnostico: {
      rotulo: "Seu diagnóstico",
      titulo: "Olhe primeiro para: {etapa}",
      // O número grande aparece separado, acima de cada frase.
      cadaDez: "de cada 10 {itens} viraram {proxima}",
      esperava: "era o que você esperava",
      texto: "O número mostra onde olhar. O motivo você descobre conversando com o time e com quem não comprou.",
      motivosPrefixo: "Motivos comuns para conferir: ",
      semEtapaEstimado: {
        titulo: "Ainda não dá para dizer onde olhar primeiro.",
        texto: "Alguns números foram estimados. Primeiro passo: anotar os números reais por 4 semanas.",
      },
      semEtapaAbaixo: {
        titulo: "Nenhuma etapa ficou abaixo do que você espera.",
        texto: "Escolha a etapa que mais pesa no seu faturamento para acompanhar toda semana.",
      },
      parcial: "Só {n} de {total} etapas puderam ser comparadas. O resultado pode mudar quando as outras forem medidas.",
      // Funil que não afunila: o card do topo não aponta etapa.
      incoerente: {
        titulo: "Confira seus números antes.",
        texto:
          "Há mais {posterior} do que {anterior}. Pode ser movimento de meses anteriores ou erro de contagem. Revise antes de tirar conclusões.",
      },
    },
    acoes: {
      titulo: "O que fazer esta semana",
      botao: "Baixar o controle semanal",
      maximo: 2,
      // Sem etapa prioritária, a primeira ação é medir ou escolher o que acompanhar.
      medir: "Anote toda semana os números reais de contatos, atendimentos, orçamentos e vendas no controle semanal.",
      conferir: "Confira os números do funil do último mês e refaça o diagnóstico com a base corrigida.",
      escolher: "Escolha a etapa que mais pesa no seu faturamento e anote o número dela toda semana no controle semanal.",
    },
    achava: {
      titulo: "Você achava x os números",
      achava: "Você achava que perdia mais em",
      naoSabia: "Você não sabia onde perdia mais.",
      apontam: "Os números apontam",
      semEtapa: "Os números ainda não apontam uma etapa.",
      semEtapaConferir: "Os números ainda não apontam uma etapa. Confira a base primeiro.",
    },
    compromisso: {
      titulo: "Seu compromisso: 4 semanas",
      numero: "Número da semana",
      naoDefinido: "Ainda não definido",
      naoPreenchido: "Não preenchido",
      semPreencher: "Você não preencheu o compromisso. Escreva no papel: número, fonte, responsável, primeira revisão, decisão e como saber que fez.",
      rotulos: { fonte: "Fonte", responsavel: "Responsável", revisao: "Primeira revisão", decisao: "Decisão", conclusao: "Como saber que fiz" },
    },
    detalhe: {
      titulo: "Seus números em detalhe",
      ver: "ver ▾",
      fechar: "fechar ▴",
      funil: "Funil do último mês",
      funilItens: ["Contatos", "Atendimentos", "Orçamentos", "Vendas"],
      semDado: "sem dado",
      cadaDez: "{x} de cada 10",
      esperava: "esperava {y}",
      indisponivel: "cálculo indisponível",
      naoSeAplica: "não se aplica ao seu negócio",
      notaMes: "Os números são do mês. Algumas vendas vêm de orçamentos de meses anteriores, então trate as comparações como aproximação.",
      economia: "Economia da venda",
      porVenda: "Cada venda deixa, depois dos custos",
      noMes: "No mês, as vendas deixaram",
      custo: "Vender custou no mês",
      faltaram: "Faltaram para cobrir",
      sobraram: "Sobraram depois de cobrir",
      notaComissao: "Confira se a comissão não foi contada duas vezes: na margem e no gasto.",
      notaGastoPorVenda: "Gasto para vender, por venda: {valor}. Não é CAC, porque inclui vendas para clientes antigos.",
      notaGastoPorVendaIndisponivel: "Gasto para vender, por venda: indisponível sem vendas no mês. Não é CAC, porque inclui vendas para clientes antigos.",
      naoCalculavel: "Não foi possível calcular.",
      vida: "Quanto um cliente deixa no tempo em que fica com você",
      churn: "Clientes que cancelam por mês",
      estimado: "Parte desses números foi estimada. Confirme com números reais antes de decidir.",
    },
    pdf: "Baixar PDF",
    semValores: "Os valores em reais e volumes ficam só no navegador onde você respondeu. Aqui aparecem apenas as razões entre as etapas.",
  },

  // Compromisso das próximas semanas. Os seis campos seguem o roteiro da aula.
  compromisso: {
    titulo: "Seu compromisso para as próximas 4 semanas",
    instrucao:
      "Quatro semanas é uma referência de acompanhamento, ajustável ao seu ciclo de venda. Use o controle semanal para anotar.",
    campos: [
      { id: "numero", rotulo: "Número", pergunta: "Qual número você vai acompanhar toda semana?", tipo: "texto" },
      { id: "fonte", rotulo: "Fonte", pergunta: "De onde ele sai?", tipo: "texto" },
      { id: "responsavel", rotulo: "Responsável", pergunta: "Quem anota?", tipo: "texto" },
      { id: "revisao", rotulo: "Primeira revisão", pergunta: "Em que data?", tipo: "data" },
      { id: "decisao", rotulo: "Decisão", pergunta: "O que você vai decidir com esse número?", tipo: "texto" },
      { id: "conclusao", rotulo: "Conclusão", pergunta: "Como você vai saber que fez?", tipo: "texto" },
    ] as { id: CampoCompromisso; rotulo: string; pergunta: string; tipo: "texto" | "data" }[],
  },

  // Medição: quantos campos reais dão cada pontuação
  medicao: { pontos1: 3, pontos2: 6 },

  // Nível de maturidade: total de pontos (0 a 8). "ate" é o limite superior de cada nível.
  niveis: [
    { ate: 2, nome: "Improviso", descricao: "O comercial depende de improviso e de poucas pessoas. Os números quase não guiam as decisões." },
    { ate: 4, nome: "Em formação", descricao: "Há partes do processo funcionando, mas ainda faltam medição ou rotina." },
    { ate: 6, nome: "Estruturado", descricao: "Processo, rotina e números existem. O ganho agora vem de ajustar a etapa mais fraca." },
    { ate: 8, nome: "Gerido por dados", descricao: "O time decide com base em números reais e opera sem depender de uma pessoa." },
  ],
};

export type Config = typeof config;
