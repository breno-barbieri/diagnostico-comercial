// Monta, no navegador, os números e textos da devolutiva a partir das respostas e do resultado.
// Nenhuma regra de cálculo da etapa prioritária mora aqui: só contas de apresentação.
// Regra geral: uma conta só existe quando todos os números de entrada existem.
import { config, type Etapa } from "../diagnostico.config";
import { ETAPAS, brl, camposAplicaveis, pagamentoEfetivo, type Respostas, type Resultado } from "./calc";

const D = config.devolutiva;

export const fmt = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
export const n1 = (x: number) => x.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
export const n0 = (x: number) => Math.round(x).toLocaleString("pt-BR");
const finito = (x: number | null): x is number => x !== null && Number.isFinite(x);

// Campos que formam cada etapa (anterior, posterior).
const CAMPOS_ETAPA: Record<Etapa, [string, string]> = {
  lead_reuniao: ["A", "B"],
  reuniao_proposta: ["B", "C"],
  proposta_venda: ["C", "D"],
};

export type Linha = { rotulo: string; valor: string; aviso: string | null; destaque?: boolean };
export type Devolutiva = ReturnType<typeof montarDevolutiva>;

export function montarDevolutiva(r: Respostas, res: Resultado) {
  const pag = pagamentoEfetivo(r.contexto);
  const num = (id: string): number | null => {
    const c = r.campos[id];
    if (!c || !c.marca || c.marca === "desconhecido" || c.marca === "nao_se_aplica") return null;
    return finito(c.valor) ? c.valor : null;
  };
  const aviso = (ids: string[]): string | null => {
    const lista = ids.filter((id) => r.campos[id]?.marca === "estimado").map((id) => D.estimado[id]);
    return lista.length > 0 ? fmt(D.avisoEstimado, { lista: lista.join(", ") }) : null;
  };
  const A = num("A"), D_ = num("D"), E = num("E"), F = num("F"), G = num("G"), H = num("H"), K = num("K");

  const lucroVenda = finito(res.lucroVenda) ? res.lucroVenda : null;

  // Quantas vendas por mês pagam o comercial (avulsa e recompra) ou meses para pagar um cliente (recorrente).
  let pagar: { n: number; d: number; aviso: string | null } | null = null;
  let recorrente: { m: string; k: number | null; aviso: string | null; avisoK: string | null } | null = null;
  if (pag === "recorrente") {
    if (finito(res.gastoPorVenda) && finito(lucroVenda) && lucroVenda > 0) {
      recorrente = { m: n1(res.gastoPorVenda / lucroVenda), k: K, aviso: aviso(["G", "D", "E", "F"]), avisoK: aviso(["K"]) };
    }
  } else if (G !== null && D_ !== null && finito(lucroVenda) && lucroVenda > 0) {
    pagar = { n: Math.ceil(G / lucroVenda), d: D_, aviso: aviso(["G", "E", "F", "D"]) };
  }

  // 2. Onde você perde vendas?
  let perde: { grande: string; c: string | null; e: string | null; aviso: string | null } | null = null;
  if (A !== null && A > 0 && D_ !== null) {
    const t = (D_ / A) * 100;
    const aplic = ETAPAS.filter((e) => !res.etapasNaoSeAplica.includes(e));
    const esp = aplic.map((e) => res.conversoes[e].esperado);
    let e: string | null = null;
    if (aplic.length > 0 && esp.every(finito)) {
      const prod = (esp as number[]).reduce((acc, v) => acc * (v / 100), 1) * 100;
      e = Math.round(prod) < 1 ? "menos" : n0(prod);
    }
    perde = {
      grande: t < 1 ? D.perde.grandeMenos : fmt(D.perde.grande, { t: n0(t) }),
      c: D_ > 0 ? n0(A / D_) : null,
      e,
      aviso: aviso(["A", "D"]),
    };
  }

  const etapas = ETAPAS.map((e) => {
    const naoSeAplica = res.etapasNaoSeAplica.includes(e);
    const pct = res.conversoes[e].pct;
    const x = finito(pct) ? Math.max(0, Math.min(10, Math.round(pct / 10))) : null;
    const esperado = res.conversoes[e].esperado;
    const y = finito(esperado) ? esperado / 10 : null;
    return { etapa: e, seta: D.etapas[e].seta, naoSeAplica, x, y, aviso: aviso(CAMPOS_ETAPA[e]), mostrar: naoSeAplica || x !== null };
  }).filter((l) => l.mostrar);

  // Aviso de números pequenos: só com etapa prioritária.
  let pequenos: string | null = null;
  if (res.gargalo) {
    const [den, numer] = CAMPOS_ETAPA[res.gargalo];
    const n = num(den), k = num(numer);
    if (n !== null && k !== null && n > 0 && n <= 100) {
      const mais = ((k + 1) / n) * 10, menos = ((k - 1) / n) * 10;
      const base = { n: n0(n), itens: D.etapas[res.gargalo].itens, proxima: D.etapas[res.gargalo].proxima, mais: n1(mais), menos: n1(menos) };
      pequenos = k >= n ? fmt(D.perde.pequenos.soMenos, base) : k === 0 ? fmt(D.perde.pequenos.soMais, base) : fmt(D.perde.pequenos.ambos, base);
    }
  }

  // 4. Sua venda se paga?
  const linhas: Linha[] = [];
  if (finito(lucroVenda)) linhas.push({ rotulo: D.paga.porVenda, valor: brl(lucroVenda), aviso: aviso(["E", "F"]) });
  if (finito(res.contribuicaoMes)) linhas.push({ rotulo: D.paga.noMes, valor: brl(res.contribuicaoMes), aviso: aviso(["D", "E", "F"]) });
  if (finito(res.gastoMes)) linhas.push({ rotulo: D.paga.custo, valor: brl(res.gastoMes), aviso: aviso(["G"]) });
  if (finito(res.diferencaMes)) {
    const falta = res.diferencaMes < 0;
    linhas.push({ rotulo: falta ? D.paga.faltaram : D.paga.sobraram, valor: brl(Math.abs(res.diferencaMes)), aviso: aviso(["D", "E", "F", "G"]), destaque: falta });
  }
  if (pag !== "avulsa" && finito(res.lucroVida)) {
    linhas.push({ rotulo: D.paga.vida, valor: brl(res.lucroVida), aviso: aviso(pag === "recompra" ? ["E", "F", "L"] : ["E", "F", "K"]) });
  }
  if (pag === "recorrente" && finito(res.churn)) {
    linhas.push({ rotulo: D.paga.churn, valor: `${n1(res.churn)}%`, aviso: aviso(["I", "J"]) });
  }

  // Recorrente: o cancelamento informado combina com o tempo que o cliente fica?
  let coerencia: string | null = null;
  if (pag === "recorrente" && finito(res.churn) && res.churn > 0 && K !== null && K > 0) {
    const implicito = 100 / res.churn;
    if (Math.abs(implicito - K) / K > 0.2) {
      coerencia = fmt(D.paga.coerencia, { churn: n1(res.churn), implicito: n1(implicito), k: n1(K) });
    }
  }
  const notaCadaVenda = E !== null && F !== null ? fmt(D.paga.notaCadaVenda, { E: brl(E), F: n1(F) }) : null;
  const notaGastoPorVenda = finito(res.gastoPorVenda) ? fmt(D.paga.notaGastoPorVenda, { valor: brl(res.gastoPorVenda) }) : null;

  // 5. Como sua operação funciona hoje
  const rotuloDe = (lista: { valor: string; rotulo: string }[], v: string | undefined) => lista.find((o) => o.valor === v)?.rotulo ?? null;
  const operacao: { rotulo: string; valor: string }[] = [];
  const quem = rotuloDe(config.contexto.find((q) => q.id === "quemVende")?.opcoes ?? [], r.contexto.quemVende);
  if (quem) operacao.push({ rotulo: D.operacao.quemVende, valor: quem });
  const dep = rotuloDe(config.ponte.dependencia.opcoes, r.ponte.dependencia);
  if (dep) operacao.push({ rotulo: D.operacao.dependencia, valor: dep });
  const rituais = r.ponte.rituais.filter((v) => v !== "nenhum").map((v) => rotuloDe(config.ponte.rituais.opcoes, v)).filter((x): x is string => !!x);
  if (r.ponte.rituais.length > 0) operacao.push({ rotulo: D.operacao.rituais, valor: rituais.length > 0 ? rituais.join(", ") : D.operacao.rituaisNenhum });
  const frase = r.ponte.clienteIdealTexto.trim();
  operacao.push({
    rotulo: D.operacao.clienteIdeal,
    valor: r.ponte.clienteIdeal === "sim" && frase ? `"${frase}"` : D.operacao.semClienteIdeal,
  });

  // 6. O que você ainda não mede
  const aplic = camposAplicaveis(pag).filter((c) => r.campos[c.id]?.marca !== "nao_se_aplica");
  const marcaDe = (id: string) => r.campos[id]?.marca ?? "desconhecido";
  const lista = (m: string) => aplic.filter((c) => marcaDe(c.id) === m).map((c) => D.campoRotulo[c.id] ?? c.rotulo);
  const reais = aplic.filter((c) => marcaDe(c.id) === "real").length;
  const estimadosLista = lista("estimado");
  const desconhecidosLista = lista("desconhecido");
  const itens = [fmt(reais === 1 ? D.mede.real : D.mede.reais, { n: reais })];
  if (estimadosLista.length > 0) itens.push(fmt(estimadosLista.length === 1 ? D.mede.estimado : D.mede.estimados, { n: estimadosLista.length }));
  if (desconhecidosLista.length > 0) itens.push(fmt(D.mede.desconhecido, { n: desconhecidosLista.length }));
  const juntar = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}` : xs[0]);
  const mede = {
    total: aplic.length,
    todosReais: reais === aplic.length,
    texto: reais === aplic.length ? fmt(D.mede.todos, { total: aplic.length }) : fmt(D.mede.intro, { total: aplic.length, itens: juntar(itens) }),
    naoMedidos: [...estimadosLista, ...desconhecidosLista],
  };

  // 8. Ciclo de venda frente às 4 semanas do compromisso
  let ciclo: string | null = null;
  if (H !== null && H >= 0) {
    const av = aviso(["H"]);
    ciclo = fmt(H > 28 ? D.compromisso.cicloLongo : D.compromisso.cicloCurto, { H: n0(H), aviso: av ? ` ${av}` : "" });
  }

  return {
    pag,
    pagar,
    recorrente,
    perde,
    etapas,
    pequenos,
    linhas,
    coerencia,
    notaCadaVenda,
    notaGastoPorVenda,
    mostrarPaga: pagar !== null || recorrente !== null || linhas.length > 0,
    operacao,
    mede,
    ciclo,
  };
}
