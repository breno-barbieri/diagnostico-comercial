import { NextResponse } from "next/server";
import { buscar } from "../../../../lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reg = await buscar(id);
  if (!reg) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  const { identificacao: _i, ...publico } = reg;
  return NextResponse.json(publico);
}
