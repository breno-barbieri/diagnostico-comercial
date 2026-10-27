import { ETAPAS, type Compromisso, type Respostas, type Resultado, aplicavel, pagamentoEfetivo } from "./calc";
import { config } from "../diagnostico.config";

// Único formato que sai do navegador. Não contém valores em reais nem volumes (A a K).
export type Registro = {
  turma: string;
  nivel: string;
  pontos: Resultado["pontos"] & { total: number };
  gargaloCalculado: string | null;
  percepcao: string;
  faixas: Record<string, string | null>;
  conversoes: Record<string, number | null>;
  esperados: Record<string, number | null>;
  conversaoReal: Record<string, boolean>;
  economia: string;
  camposReais: number;
  camposEstimados: number;
  camposDesconhecidos: number;
  marcas: Record<string, string>;
  contexto: Record<string, string>;
  ponte: Respostas["ponte"];
  gargalosConfirmados: string[];
  compromisso: Compromisso;
  identificacao: Respostas["identificacao"] | null;
  consentimento: boolean;
};

export function montarRegistro(r: Respostas, res: Resultado): Registro {
  const pagamento = pagamentoEfetivo(r.contexto);
  const marcas: Record<string, string> = {};
  for (const c of config.campos) {
    if (aplicavel(c, pagamento)) marcas[c.id] = r.campos[c.id]?.marca ?? "desconhecido";
  }
  const faixas: Record<string, string | null> = {};
  const conversoes: Record<string, number | null> = {};
  const esperados: Record<string, number | null> = {};
  const conversaoReal: Record<string, boolean> = {};
  for (const e of ETAPAS) {
    faixas[e] = res.conversoes[e].faixa;
    const p = res.conversoes[e].pct;
    conversoes[e] = p === null ? null : Math.round(p);
    esperados[e] = res.conversoes[e].esperado;
    conversaoReal[e] = !res.etapasSemDadoReal.includes(e);
  }
  const i = r.identificacao;
  const identificado = Object.values(i).some((x) => x.trim() !== "");
  return {
    turma: r.turma || config.turmaPadrao,
    nivel: res.nivel,
    pontos: { ...res.pontos, total: res.total },
    gargaloCalculado: res.gargalo,
    percepcao: r.percepcao,
    faixas,
    conversoes,
    esperados,
    conversaoReal,
    economia: res.economia,
    camposReais: res.medicao.reais,
    camposEstimados: res.medicao.estimados,
    camposDesconhecidos: res.medicao.desconhecidos,
    marcas,
    contexto: r.contexto,
    ponte: r.ponte,
    gargalosConfirmados: r.gargalosConfirmados,
    compromisso: r.compromisso,
    identificacao: identificado ? i : null,
    consentimento: identificado ? r.consentimento : false,
  };
}
