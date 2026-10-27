import { randomBytes } from "node:crypto";
import type { Registro } from "./registro";

// Dois bancos possíveis:
// - Supabase (produção, Vercel): quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY existem no ambiente.
// - SQLite local (desenvolvimento): arquivo data/diagnostico.db, quando as variáveis não existem.
const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usaSupabase = !!(SUPA_URL && SUPA_KEY);

async function supa(caminho: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${caminho}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SUPA_KEY!,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r;
}

// SQLite carregado só quando usado, para não exigir o módulo nativo em produção.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlite: any = null;
function getSqlite() {
  if (sqlite) return sqlite;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs");
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  sqlite = new Database(path.join(dir, "diagnostico.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS respostas (
      id TEXT PRIMARY KEY,
      criado_em TEXT NOT NULL,
      turma TEXT NOT NULL,
      dados TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_respostas_turma ON respostas (turma);
  `);
  return sqlite;
}

export async function inserir(reg: Registro): Promise<string> {
  const id = randomBytes(6).toString("hex");
  const criado_em = new Date().toISOString();
  if (usaSupabase) {
    await supa("respostas", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ id, criado_em, turma: reg.turma, dados: reg }),
    });
  } else {
    getSqlite()
      .prepare("INSERT INTO respostas (id, criado_em, turma, dados) VALUES (?, ?, ?, ?)")
      .run(id, criado_em, reg.turma, JSON.stringify(reg));
  }
  return id;
}

export async function buscar(id: string): Promise<Registro | null> {
  if (usaSupabase) {
    const r = await supa(`respostas?id=eq.${encodeURIComponent(id)}&select=dados`);
    const rows = (await r.json()) as { dados: Registro }[];
    return rows[0]?.dados ?? null;
  }
  const row = getSqlite().prepare("SELECT dados FROM respostas WHERE id = ?").get(id) as { dados: string } | undefined;
  return row ? (JSON.parse(row.dados) as Registro) : null;
}

export async function listarTurma(turma: string): Promise<Registro[]> {
  if (usaSupabase) {
    const r = await supa(`respostas?turma=eq.${encodeURIComponent(turma)}&select=dados&limit=2000`);
    const rows = (await r.json()) as { dados: Registro }[];
    return rows.map((x) => x.dados);
  }
  const rows = getSqlite().prepare("SELECT dados FROM respostas WHERE turma = ?").all(turma) as { dados: string }[];
  return rows.map((r) => JSON.parse(r.dados) as Registro);
}

export async function apagarTurma(turma: string): Promise<void> {
  if (usaSupabase) {
    await supa(`respostas?turma=eq.${encodeURIComponent(turma)}`, { method: "DELETE" });
    return;
  }
  getSqlite().prepare("DELETE FROM respostas WHERE turma = ?").run(turma);
}
