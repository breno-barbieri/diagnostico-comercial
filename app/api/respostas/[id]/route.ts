import { NextResponse } from "next/server";
import { atualizarCompromisso, buscar } from "../../../../lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reg = await buscar(id);
  if (!reg) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  const { identificacao: _i, ...publico } = reg;
  return NextResponse.json(publico);
}

// Grava o compromisso e a frente, preenchidos na tela de resultado. Só textos curtos.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { compromisso?: Record<string, unknown>; frente?: string };
  const c = body.compromisso ?? {};
  const compromisso = { numero: "", fonte: "", responsavel: "", revisao: "", decisao: "", conclusao: "" };
  for (const k of Object.keys(compromisso) as (keyof typeof compromisso)[]) compromisso[k] = String(c[k] ?? "").slice(0, 200);
  const frente = ["funil", "economia", "rotina"].includes(String(body.frente)) ? String(body.frente) : "";
  const ok = await atualizarCompromisso(id, compromisso, frente);
  if (!ok) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
