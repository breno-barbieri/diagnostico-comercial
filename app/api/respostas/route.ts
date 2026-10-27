import { NextResponse } from "next/server";
import { inserir } from "../../../lib/db";
import type { Registro } from "../../../lib/registro";

// Só percentuais de 0 a 1000 (conversões e expectativas), nunca volumes ou valores em reais.
function limparNumeros(o: Record<string, unknown> | undefined): Record<string, number | null> {
  const r: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(o ?? {})) {
    const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
    r[k] = n !== null && n >= 0 && n <= 1000 ? n : null;
  }
  return r;
}

// Seis campos de texto curto. Aceita o formato antigo (texto único) como "número".
function limparCompromisso(c: unknown): Registro["compromisso"] {
  const base = { numero: "", fonte: "", responsavel: "", revisao: "", decisao: "", conclusao: "" };
  if (typeof c === "string") return { ...base, numero: c.slice(0, 200) };
  const o = (c ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(base) as (keyof typeof base)[]) base[k] = String(o[k] ?? "").slice(0, 200);
  return base;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Registro;
  if (!body || typeof body.turma !== "string" || typeof body.nivel !== "string") {
    return NextResponse.json({ erro: "registro inválido" }, { status: 400 });
  }
  // Defesa: nada além de marcas, faixas e contagens. Descarta qualquer campo numérico fora do esperado.
  const limpo: Registro = {
    turma: body.turma.slice(0, 60),
    nivel: body.nivel,
    pontos: body.pontos,
    gargaloCalculado: body.gargaloCalculado ?? null,
    percepcao: body.percepcao,
    faixas: body.faixas,
    conversoes: limparNumeros(body.conversoes),
    esperados: limparNumeros(body.esperados),
    conversaoReal: Object.fromEntries(Object.entries(body.conversaoReal ?? {}).map(([k, v]) => [k, !!v])),
    economia: body.economia,
    camposReais: Number(body.camposReais) || 0,
    camposEstimados: Number(body.camposEstimados) || 0,
    camposDesconhecidos: Number(body.camposDesconhecidos) || 0,
    marcas: body.marcas,
    contexto: body.contexto,
    ponte: body.ponte,
    gargalosConfirmados: body.gargalosConfirmados ?? [],
    compromisso: limparCompromisso(body.compromisso),
    identificacao: body.consentimento ? body.identificacao : null,
    consentimento: !!body.consentimento && !!body.identificacao,
  };
  return NextResponse.json({ id: await inserir(limpo) });
}
