import { COMPROMISSO_VAZIO, calcular, camposAplicaveis, pagamentoEfetivo, type Campo, type Marca, type Respostas } from "../lib/calc";
import { montarRegistro } from "../lib/registro";
import { apagarTurma, inserir } from "../lib/db";
import { config } from "../diagnostico.config";

const rnd = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const marca = (): Marca => {
  const x = Math.random();
  return x < 0.45 ? "real" : x < 0.85 ? "estimado" : "desconhecido";
};

async function main() {
await apagarTurma(process.env.TURMA ?? "demo");
for (let i = 0; i < 30; i++) {
  const pagamentoEscolhido = pick(config.contexto[0].opcoes).valor;
  const operacao = pagamentoEscolhido === "misto" ? pick(config.operacaoMista.opcoes) : undefined;
  const pagamento = pagamentoEfetivo({ pagamento: pagamentoEscolhido, ...(operacao ? { operacao } : {}) });
  const A = rnd(40, 400);
  const B = Math.round(A * (rnd(8, 55) / 100));
  const C = Math.round(B * (rnd(30, 85) / 100));
  const D = Math.round(C * (rnd(10, 55) / 100));
  const base: Record<string, number> = {
    A, B, C, D,
    E: rnd(300, 8000), F: rnd(20, 80), G: rnd(2000, 40000), H: rnd(3, 90),
    I: rnd(10, 200), J: rnd(0, 12), K: rnd(3, 36),
  };
  const campos: Record<string, Campo> = {};
  for (const c of camposAplicaveis(pagamento)) {
    const m = marca();
    campos[c.id] = { marca: m, valor: m === "desconhecido" ? null : base[c.id] };
    if (c.id === "C" && Math.random() < 0.1) campos[c.id] = { marca: "nao_se_aplica", valor: null };
  }
  const todos = config.ponte.rituais.opcoes.filter((o) => o.valor !== "nenhum").map((o) => o.valor);
  const rituais = Math.random() < 0.25 ? ["nenhum"] : todos.filter(() => Math.random() < 0.45);
  const r: Respostas = {
    identificacao: { nome: "", empresa: "", cargo: "", email: "", whatsapp: "", faturamento: "" },
    consentimento: false,
    turma: process.env.TURMA ?? "demo",
    contexto: {
      pagamento: pagamentoEscolhido,
      ...(operacao ? { operacao } : {}),
      evolucao: pick(config.contexto[1].opcoes).valor,
      quemVende: pick(config.contexto[2].opcoes).valor,
    },
    percepcao: pick(config.percepcao.opcoes).valor,
    expectativas: { lead_reuniao: rnd(3, 7), reuniao_proposta: rnd(5, 9), proposta_venda: rnd(3, 6) },
    campos,
    ponte: {
      rituais: rituais.length ? rituais : ["nenhum"],
      clienteIdeal: Math.random() < 0.5 ? "sim" : "nao",
      clienteIdealTexto: "",
      dependencia: pick(config.ponte.dependencia.opcoes).valor,
      registro: pick(config.ponte.registro.opcoes).valor,
    },
    gargalosConfirmados: [],
    compromisso: { ...COMPROMISSO_VAZIO },
    frente: pick(config.frente.opcoes).valor,
  };
  const res = calcular(r);
  await inserir(montarRegistro(r, res));
}
console.log("30 respostas fictícias inseridas. Abra /painel?turma= com o nome da turma");
}
main();
