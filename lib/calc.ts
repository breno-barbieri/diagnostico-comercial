import { config, type CampoCompromisso, type Etapa } from "../diagnostico.config";

export type Compromisso = Record<CampoCompromisso, string>;
export const COMPROMISSO_VAZIO: Compromisso = { numero: "", fonte: "", responsavel: "", revisao: "", decisao: "", conclusao: "" };

export type Marca = "real" | "estimado" | "desconhecido" | "nao_se_aplica";
export type Campo = { valor: number | null; marca: Marca | null };
export type Faixa = "abaixo" | "dentro" | "acima";
export type EconomiaStatus = "paga" | "nao_paga" | "nao_calculavel";

export type Respostas = {
  identificacao: {
    nome: string;
    empresa: string;
    cargo: string;
    email: string;
    whatsapp: string;
    faturamento: string;
  };
  consentimento: boolean;
  turma: string;
  contexto: Record<string, string>;
  percepcao: string;
  expectativas: Partial<Record<Etapa, number | null>>;
  campos: Record<string, Campo>;
  ponte: {
    rituais: string[];
    clienteIdeal: "sim" | "nao" | "";
    clienteIdealTexto: string;
    dependencia: string;
  };
  gargalosConfirmados: string[];
  compromisso: Compromisso;
};

export type Conversao = { pct: number | null; faixa: Faixa | null; esperado: number | null };

export type Resultado = {
  conversoes: Record<Etapa, Conversao> & { lead_venda: { pct: number | null } };
  gargalo: Etapa | null;
  percepcao: string;
  divergencia: boolean | null;
  gastoPorVenda: number | null;
  contribuicaoMes: number | null;
  gastoMes: number | null;
  diferencaMes: number | null;
  lucroVenda: number | null;
  lucroVida: number | null;
  churn: number | null;
  economia: EconomiaStatus;
  economiaTipo: "venda" | "vida" | null;
  leiturasEconomia: string[];
  medicao: { reais: number; estimados: number; desconhecidos: number; total: number };
  pontos: { medicao: number; economia: number; gestao: number; dependencia: number };
  total: number;
  nivel: string;
  sugestoes: string[];
  etapasSemDadoReal: Etapa[];
  etapasNaoSeAplica: Etapa[];
  etapasComparadas: Etapa[];
  analiseParcial: boolean;
  alertasBase: string[];
  incoerencias: { anterior: string; posterior: string }[];
  acoes: string[];
};

export const ETAPAS: Etapa[] = ["lead_reuniao", "reuniao_proposta", "proposta_venda"];

// Em negócio misto o aluno escolhe uma operação e responde tudo sobre ela.
export function pagamentoEfetivo(contexto: Record<string, string>): string {
  const p = contexto.pagamento ?? "";
  return p === "misto" ? contexto.operacao ?? "" : p;
}

export function aplicavel(campo: { somenteRecorrente?: boolean; somenteRecompra?: boolean }, pagamento: string) {
  if (campo.somenteRecorrente) return pagamento === "recorrente";
  if (campo.somenteRecompra) return pagamento === "recompra";
  return true;
}

// Campos que formam cada etapa. O gargalo só é apontado quando os dois números são reais.
const CAMPOS_ETAPA: Record<Etapa, [string, string]> = {
  lead_reuniao: ["A", "B"],
  reuniao_proposta: ["B", "C"],
  proposta_venda: ["C", "D"],
};

export function camposAplicaveis(pagamento: string) {
  return config.campos.filter((c) => aplicavel(c, pagamento));
}

function valor(c: Campo | undefined): number | null {
  if (!c || !c.marca || c.marca === "desconhecido") return null;
  if (c.valor === null || c.valor === undefined || Number.isNaN(c.valor)) return null;
  return c.valor;
}

function razao(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return (a / b) * 100;
}

function faixaDe(etapa: Etapa, pct: number | null): Faixa | null {
  if (pct === null || !config.usarFaixas) return null;
  const f = config.faixas[etapa];
  if (pct < f.min) return "abaixo";
  if (pct > f.max) return "acima";
  return "dentro";
}

export function nivelDe(total: number) {
  return (config.niveis.find((n) => total <= n.ate) ?? config.niveis[config.niveis.length - 1]).nome;
}

export function calcular(r: Respostas): Resultado {
  const pagamento = pagamentoEfetivo(r.contexto);
  const recorrente = pagamento === "recorrente";
  const recompra = pagamento === "recompra";
  const v = (id: string) => valor(r.campos[id]);
  const A = v("A"), B = v("B"), C = v("C"), D = v("D");
  const E = v("E"), F = v("F"), G = v("G"), H = r.campos.H;
  const I = v("I"), J = v("J"), K = v("K"), L_ = v("L");

  const pcts: Record<Etapa, number | null> = {
    lead_reuniao: razao(B, A),
    reuniao_proposta: razao(C, B),
    proposta_venda: razao(D, C),
  };
  const esp = (e: Etapa): number | null => {
    const x = r.expectativas?.[e];
    return x === null || x === undefined || Number.isNaN(x) ? null : x * 10;
  };
  const conversoes = {
    lead_reuniao: { pct: pcts.lead_reuniao, faixa: faixaDe("lead_reuniao", pcts.lead_reuniao), esperado: esp("lead_reuniao") },
    reuniao_proposta: { pct: pcts.reuniao_proposta, faixa: faixaDe("reuniao_proposta", pcts.reuniao_proposta), esperado: esp("reuniao_proposta") },
    proposta_venda: { pct: pcts.proposta_venda, faixa: faixaDe("proposta_venda", pcts.proposta_venda), esperado: esp("proposta_venda") },
    lead_venda: { pct: razao(D, A) },
  };

  // Gargalo: maior distância abaixo da expectativa do próprio aluno (ou da faixa, se usarFaixas), em proporção da referência,
  // só entre etapas com números reais.
  const ehReal = (id: string) => r.campos[id]?.marca === "real";
  const naoSeAplica = (id: string) => r.campos[id]?.marca === "nao_se_aplica";
  const etapasNaoSeAplica = ETAPAS.filter((e) => CAMPOS_ETAPA[e].some(naoSeAplica));
  const etapasSemDadoReal = ETAPAS.filter((e) => !etapasNaoSeAplica.includes(e) && !CAMPOS_ETAPA[e].every(ehReal));
  let gargalo: Etapa | null = null;
  let pior = 0;
  for (const e of ETAPAS) {
    const p = pcts[e];
    if (p === null || etapasSemDadoReal.includes(e) || etapasNaoSeAplica.includes(e)) continue;
    const e10 = esp(e);
    const ref = e10 !== null && e10 > 0 ? e10 : config.usarFaixas ? config.faixas[e].min : null;
    if (ref === null) continue;
    const dist = (ref - p) / ref;
    if (dist > pior) {
      pior = dist;
      gargalo = e;
    }
  }

  const etapasComparadas = ETAPAS.filter(
    (e) => !etapasNaoSeAplica.includes(e) && !etapasSemDadoReal.includes(e) && pcts[e] !== null && esp(e) !== null,
  );
  const etapasExistentes = ETAPAS.length - etapasNaoSeAplica.length;
  const analiseParcial = etapasComparadas.length < etapasExistentes;

  // Números incompatíveis com um funil que afunila. Só alerta: movimentos do mês podem vir de grupos anteriores.
  const incoerencias: { anterior: string; posterior: string }[] = [];
  const sequencia: [string, string, string, string][] = [["A", "B", "contatos", "atendimentos"], ["B", "C", "atendimentos", "orçamentos"], ["C", "D", "orçamentos", "vendas"]];
  for (const [x, y, nx, ny] of sequencia) {
    const vx = v(x), vy = v(y);
    if (vx !== null && vy !== null && vy > vx) incoerencias.push({ anterior: nx, posterior: ny });
  }
  const alertasBase = incoerencias.map((i) =>
    config.textos.alertaBase.replace("{posterior}", i.posterior).replace("{anterior}", i.anterior),
  );

  const divergencia =
    gargalo && r.percepcao && r.percepcao !== "nao_sei" ? r.percepcao !== gargalo : null;

  // Economia
  // Gasto comercial total dividido pelas vendas do mês. Não é CAC: CAC exige só clientes novos e custos de aquisição compatíveis.
  const gastoPorVenda = G !== null && D !== null && D > 0 ? G / D : null;
  const lucroVenda = E !== null && F !== null ? (E * F) / 100 : null;
  const vezes = recompra ? L_ : K;
  // Conta do mês, como no exemplo da aula: vendas × ticket × margem, menos o gasto comercial do mês.
  const contribuicaoMes = lucroVenda !== null && D !== null ? D * lucroVenda : null;
  const gastoMes = G;
  const diferencaMes = contribuicaoMes !== null && gastoMes !== null ? contribuicaoMes - gastoMes : null;
  const lucroVida = lucroVenda !== null && vezes !== null ? lucroVenda * vezes : null;
  const churn = I !== null && J !== null && I > 0 ? (J / I) * 100 : null;

  let economiaTipo: "venda" | "vida" | null = null;
  let lucro: number | null = null;
  if ((recorrente || recompra) && lucroVida !== null) {
    economiaTipo = "vida";
    lucro = lucroVida;
  } else if (pagamento === "avulsa" && lucroVenda !== null) {
    economiaTipo = "venda";
    lucro = lucroVenda;
  }
  const economia: EconomiaStatus =
    gastoPorVenda === null || lucro === null ? "nao_calculavel" : lucro >= gastoPorVenda ? "paga" : "nao_paga";

  const L = config.leiturasEconomia;
  const leiturasEconomia: string[] = [];
  if (economia === "nao_paga") {
    leiturasEconomia.push(economiaTipo === "vida" ? L.naoPagaVida : L.naoPagaAvulsa);
  }
  const semChurn = recorrente && (r.campos.I?.marca === "desconhecido" || r.campos.J?.marca === "desconhecido" || churn === null);
  if (semChurn) leiturasEconomia.push(L.churnSemDado);
  const cicloIncerto = !H || H.marca === "estimado" || H.marca === "desconhecido" || H.marca === null;
  if (cicloIncerto) leiturasEconomia.push(L.cicloIncerto);

  // Medição: campos reais entre os aplicáveis
  const aplic = camposAplicaveis(pagamento);
  const marcas = aplic.filter((c) => r.campos[c.id]?.marca !== "nao_se_aplica").map((c) => r.campos[c.id]?.marca ?? "desconhecido");
  const reais = marcas.filter((m) => m === "real").length;
  const estimados = marcas.filter((m) => m === "estimado").length;
  const desconhecidos = marcas.filter((m) => m === "desconhecido").length;

  const pontosMedicao = reais >= config.medicao.pontos2 ? 2 : reais >= config.medicao.pontos1 ? 1 : 0;
  const pontosEconomia = economia === "paga" ? 2 : economia === "nao_calculavel" ? 1 : 0;
  const nRituais = r.ponte.rituais.filter((x) => x !== "nenhum").length;
  const pontosGestao = nRituais >= 2 ? 2 : nRituais === 1 ? 1 : 0;
  const pontosDep =
    config.ponte.dependencia.opcoes.find((o) => o.valor === r.ponte.dependencia)?.pontos ?? 0;
  const total = pontosMedicao + pontosEconomia + pontosGestao + pontosDep;

  // Sugestão de até 3 gargalos
  const sug: string[] = [];
  const add = (s: string) => {
    if (!sug.includes(s) && sug.length < config.maxGargalos) sug.push(s);
  };
  if (gargalo) add(config.gargaloPorEtapa[gargalo]);
  else if (etapasSemDadoReal.length > 0) add("Medição e números");
  else if (r.percepcao === "topo") add("Geração de demanda");
  if (pontosMedicao < 2) add("Medição e números");
  if (pontosDep === 0) add("Dependência de pessoas");
  if (pontosGestao === 0) add("Acompanhamento e gestão");
  if (sug.length === 0) add("Geração de demanda");

  // Ações para a semana seguinte
  const AC = config.acoes;
  const acoes: string[] = [];
  if (gargalo) acoes.push(AC.gargalo[gargalo]);
  if (etapasSemDadoReal.length > 0) {
    const lista = etapasSemDadoReal.map((e) => config.faixas[e].rotulo.toLowerCase());
    const nomes = lista.length > 1 ? `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}` : lista[0];
    acoes.push(AC.medirEtapa.replace("{etapas}", nomes));
  } else if (pontosMedicao < 2) {
    acoes.push(AC.medicao);
  }
  if (economia === "nao_paga") acoes.push(economiaTipo === "vida" ? AC.naoPagaVida : AC.naoPagaAvulsa);
  if (semChurn) acoes.push(AC.churnSemDado);
  if (cicloIncerto) acoes.push(AC.cicloIncerto);
  if (pontosDep === 0) acoes.push(AC.dependencia);
  if (pontosGestao === 0) acoes.push(AC.gestao);

  return {
    etapasSemDadoReal,
    etapasNaoSeAplica,
    etapasComparadas,
    analiseParcial,
    alertasBase,
    incoerencias,
    acoes,
    conversoes,
    gargalo,
    percepcao: r.percepcao,
    divergencia,
    gastoPorVenda,
    contribuicaoMes,
    gastoMes,
    diferencaMes,
    lucroVenda,
    lucroVida,
    churn,
    economia,
    economiaTipo,
    leiturasEconomia,
    medicao: { reais, estimados, desconhecidos, total: marcas.length },
    pontos: { medicao: pontosMedicao, economia: pontosEconomia, gestao: pontosGestao, dependencia: pontosDep },
    total,
    nivel: nivelDe(total),
    sugestoes: sug,
  };
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct1 = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
