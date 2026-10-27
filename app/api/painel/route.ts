import { NextResponse } from "next/server";
import { listarTurma } from "../../../lib/db";
import { agregar } from "../../../lib/painel";
import { config } from "../../../diagnostico.config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const turma = new URL(req.url).searchParams.get("turma") || config.turmaPadrao;
  return NextResponse.json({ turma, ...agregar(await listarTurma(turma)) });
}
