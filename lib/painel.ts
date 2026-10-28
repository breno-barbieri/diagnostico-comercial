import { config } from "../diagnostico.config";
import type { Registro } from "./registro";

export type PainelDados = ReturnType<typeof agregar>;

const cont = (xs: (string | null | undefined)[]) => {
  const m: Record<string, number> = {};
  for (const x of xs) {
    const k = x ?? "sem_dado";
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
};

const mediana = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

// Só números consolidados. Nenhuma resposta individual nem nome sai daqui.
export function agregar(regs: Registro[]) {
  const total = regs.length;
  const camposIncertos = config.campos.map((c) => {
    const base = regs.filter((r) => r.marcas[c.id] !== undefined && r.marcas[c.id] !== "nao_se_aplica");
    const incertos = base.filter((r) => r.marcas[c.id] !== "real").length;
    return {
      id: c.id,
      rotulo: c.rotulo,
      base: base.length,
      pct: base.length ? Math.round((incertos / base.length) * 100) : 0,
    };
  });

  const etapas = ["topo", "lead_reuniao", "reuniao_proposta", "proposta_venda"];
  const perc = cont(regs.map((r) => r.percepcao));
  const garg = cont(regs.map((r) => r.gargaloCalculado));
  const percepcaoVsDado = etapas.map((e) => ({
    etapa: e,
    rotulo: config.devolutiva.setaPercepcao[e] ?? e,
    percepcao: perc[e] ?? 0,
    dado: garg[e] ?? 0,
  }));

  // Conversão da turma por etapa: mediana do que foi informado e mediana do que cada um esperava.
  const conversaoTurma = (["lead_reuniao", "reuniao_proposta", "proposta_venda"] as const).map((e) => {
    const reais = regs.map((r) => r.conversoes?.[e]).filter((x): x is number => typeof x === "number");
    const esper = regs.map((r) => r.esperados?.[e]).filter((x): x is number => typeof x === "number");
    return {
      etapa: e,
      rotulo: config.devolutiva.etapas[e].seta,
      mediana: mediana(reais),
      medianaEsperada: mediana(esper),
      n: reais.length,
      nReais: regs.filter((r) => r.conversaoReal?.[e] && typeof r.conversoes?.[e] === "number").length,
    };
  });

  const calculaveis = regs.filter((r) => r.economia !== "nao_calculavel");
  const naoPaga = regs.filter((r) => r.economia === "nao_paga").length;
  const economia = {
    baseCalculavel: calculaveis.length,
    naoPaga,
    pct: calculaveis.length ? Math.round((naoPaga / calculaveis.length) * 100) : 0,
    naoCalculavel: regs.length - calculaveis.length,
  };

  // Etapa mais frequente. Em caso de empate, devolve todas as líderes na ordem do funil.
  const ordem = ["lead_reuniao", "reuniao_proposta", "proposta_venda"];
  const ranking = Object.entries(garg).filter(([k]) => k !== "sem_dado").sort((a, b) => b[1] - a[1]);
  const topo = ranking[0]?.[1] ?? 0;
  const lideres = ranking
    .filter(([, q]) => q === topo)
    .map(([k]) => ({ etapa: k, rotulo: config.devolutiva.setaPercepcao[k] ?? k }))
    .sort((a, b) => ordem.indexOf(a.etapa) - ordem.indexOf(b.etapa));

  // Base das leituras de etapa: quantas respostas têm números reais comparáveis e quantas tiveram etapa apontada.
  const etapasCalc = ["lead_reuniao", "reuniao_proposta", "proposta_venda"] as const;
  const baseEtapas = {
    comNumerosReais: regs.filter((r) => etapasCalc.some((e) => r.conversaoReal?.[e] && typeof r.conversoes?.[e] === "number")).length,
    semEtapaApontada: regs.filter((r) => !r.gargaloCalculado).length,
  };

  const rituais = config.ponte.rituais.opcoes.map((o) => ({
    valor: o.valor,
    rotulo: o.rotulo,
    qtd: regs.filter((r) => r.ponte.rituais.includes(o.valor)).length,
  }));

  // Medição da turma: quantos números informados não eram reais.
  const funilIds = ["A", "B", "C", "D"];
  let informados = 0, incertos = 0, ecoBase = 0, ecoIncertos = 0;
  for (const r of regs) {
    for (const [id, m] of Object.entries(r.marcas ?? {})) {
      if (m === "nao_se_aplica") continue;
      informados++;
      if (m !== "real") incertos++;
      if (!funilIds.includes(id)) { ecoBase++; if (m !== "real") ecoIncertos++; }
    }
  }
  const medicao = {
    informados,
    pct: informados ? Math.round((incertos / informados) * 100) : 0,
    funil: camposIncertos.filter((c) => funilIds.includes(c.id) && c.base > 0).map((c) => ({ id: c.id, pct: c.pct })),
    economia: ecoBase ? Math.round((ecoIncertos / ecoBase) * 100) : null,
  };

  // Onde a turma acha que perde: a resposta mais comum (sem "não sei").
  const achaRanking = Object.entries(perc).filter(([k]) => k !== "nao_sei" && k !== "sem_dado").sort((a, b) => b[1] - a[1]);
  const acha = achaRanking[0] ? { etapa: achaRanking[0][0], rotulo: config.devolutiva.setaPercepcao[achaRanking[0][0]] ?? achaRanking[0][0], qtd: achaRanking[0][1] } : null;

  // Frente escolhida para as próximas 4 semanas.
  const frentes = config.frente.opcoes.map((o) => ({ valor: o.valor, rotulo: o.rotulo, passo: o.passo, qtd: regs.filter((r) => r.frente === o.valor).length }));

  // Quantas empresas param de vender se quem mais vende sair por uma semana.
  const depResp = regs.filter((r) => r.ponte?.dependencia);
  const dependencia = { base: depResp.length, param: depResp.filter((r) => r.ponte.dependencia === "tudo_para").length };

  // Esperado x conseguido, só com números reais: mediana de cada etapa e a etapa com a maior distância.
  const esperadoConseguido = (["lead_reuniao", "reuniao_proposta", "proposta_venda"] as const)
    .map((e) => {
      const ok = regs.filter((r) => r.conversaoReal?.[e] && typeof r.conversoes?.[e] === "number" && typeof r.esperados?.[e] === "number");
      const conseguiu = mediana(ok.map((r) => r.conversoes[e] as number));
      const esperava = mediana(ok.map((r) => r.esperados[e] as number));
      return { etapa: e, n: ok.length, conseguiu, esperava };
    })
    .filter((x) => x.n > 0 && x.conseguiu !== null && x.esperava !== null && x.esperava > 0)
    .sort((a, b) => (b.esperava! - b.conseguiu!) / b.esperava! - (a.esperava! - a.conseguiu!) / a.esperava!)[0] ?? null;

  return {
    total,
    medicao,
    dependencia,
    esperadoConseguido,
    acha,
    frentes,
    conversaoTurma,
    camposIncertos,
    percepcaoVsDado,
    baseEtapas,
    semGargaloCalculado: garg["sem_dado"] ?? 0,
    economia,
    gargaloMaisFrequente: lideres.length > 0 ? { qtd: topo, etapas: lideres, empate: lideres.length > 1 } : null,
    rituais: rituais.sort((a, b) => b.qtd - a.qtd),
  };
}
