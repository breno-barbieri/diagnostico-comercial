"use client";

import { Fragment, useEffect, useState } from "react";
import type { PainelDados } from "../lib/painel";
import { Onda } from "./Marca";
import { config } from "../diagnostico.config";

const P = config.painel;
const NOME_FUNIL: Record<string, string> = { A: "Contatos", B: "Atendimentos", C: "Orçamentos", D: "Vendas" };
const fmt = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const listaE = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}` : xs[0] ?? "");
// Proporção de 0 a 1 em "x de cada 10", com uma casa quando não for inteira.
const dezDe = (p: number) => (Math.round(p * 100) / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

// Texto com **trechos em negrito**.
function Rico({ texto }: { texto: string }) {
  return <>{texto.split("**").map((t, i) => (i % 2 === 1 ? <b key={i} className="font-semibold text-white">{t}</b> : <Fragment key={i}>{t}</Fragment>))}</>;
}

function Barra({ rotulo, pct, apagado = false }: { rotulo: string; pct: number; apagado?: boolean }) {
  return (
    <div className={`my-3 grid grid-cols-[8rem_1fr_3.5rem] items-center gap-3 text-lg lg:text-xl ${apagado ? "text-papel/50" : ""}`}>
      <span>{rotulo}</span>
      <div className="h-3.5 rounded-full bg-papel/10">
        <div className={`h-3.5 rounded-full transition-all duration-700 ${apagado ? "bg-papel/40" : "bg-papel"}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="text-right">{pct}%</span>
    </div>
  );
}

export default function PainelView({ turma }: { turma: string }) {
  const [d, setD] = useState<(PainelDados & { turma: string }) | null>(null);
  useEffect(() => {
    const carregar = () => fetch(`/api/painel?turma=${encodeURIComponent(turma)}`).then((r) => r.json()).then(setD).catch(() => {});
    carregar();
    const t = setInterval(carregar, 10000);
    return () => clearInterval(t);
  }, [turma]);

  if (!d) return <main className="min-h-screen bg-tinta p-12 text-3xl text-papel">Carregando...</main>;

  const topoDado = d.gargaloMaisFrequente;
  const dadoRotulo = topoDado ? listaE(topoDado.etapas.map((e) => e.rotulo)) : null;
  const frasePerde = !d.acha
    ? null
    : !topoDado
      ? fmt(P.perde.fraseSemDado, { acha: d.acha.rotulo })
      : topoDado.empate
        ? fmt(P.perde.fraseEmpate, { acha: d.acha.rotulo, dado: dadoRotulo! })
        : topoDado.etapas[0].etapa === d.acha.etapa
          ? fmt(P.perde.fraseCoincide, { acha: d.acha.rotulo })
          : fmt(P.perde.fraseDiverge, { acha: d.acha.rotulo, dado: dadoRotulo! });

  const respondeuFrente = d.frentes.reduce((s, f) => s + f.qtd, 0);
  const maxFrente = Math.max(0, ...d.frentes.map((f) => f.qtd));
  const lideresFrente = d.frentes.filter((f) => f.qtd === maxFrente && maxFrente > 0);
  const fraseFrente =
    respondeuFrente === 0
      ? P.frente.semResposta
      : lideresFrente.length > 1
        ? fmt(P.frente.fraseEmpate, { frentes: listaE(lideresFrente.map((f) => minuscula(f.rotulo))) })
        : fmt(P.frente.frase, { frente: minuscula(lideresFrente[0].rotulo), passo: lideresFrente[0].passo });

  const semApontada = d.baseEtapas.semEtapaApontada;
  const concl = "my-4 border-l-[3px] border-bronze pl-3.5 text-xl leading-snug lg:text-2xl";

  return (
    <main className="min-h-screen bg-tinta px-5 py-6 text-papel lg:px-14 lg:py-10">
      <header className="flex flex-col gap-3 border-b border-papel/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-end gap-4 lg:gap-8">
          <Onda className="w-20 lg:w-36" cor="#F2F0EC" />
          <div>
            <div className="rotulo">Diagnóstico comercial · {config.evento}{d.turma !== config.turmaPadrao ? ` · ${d.turma}` : ""}</div>
            <h1 className="mt-2 text-3xl leading-none lg:text-5xl">{P.titulo}</h1>
          </div>
        </div>
        <div className="text-sm text-papel/55 lg:text-lg">
          {d.total === 1 ? P.umaResposta : fmt(P.respostas, { n: d.total })} · {P.atualiza}
        </div>
      </header>

      {d.total === 0 ? (
        <div className="pt-16 font-display text-4xl text-papel/70">{P.aguardando}</div>
      ) : (
        <>
          {/* 01 · Medição */}
          <section className="grid gap-10 border-b border-papel/15 py-8 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
            <div>
              <div className="rotulo">{P.medicao.rotulo}</div>
              <div className="mt-2 font-display text-8xl leading-none lg:text-[120px]">{d.medicao.pct}%</div>
              <p className="mt-3 text-2xl leading-snug lg:text-[28px]"><Rico texto={P.medicao.frase} /></p>
              <p className="mt-2 text-base text-papel/55 lg:text-lg">
                {fmt(P.medicao.base, { empresas: d.total === 1 ? "1 empresa" : `${d.total} empresas`, numeros: d.medicao.informados })}
              </p>
            </div>
            <div>
              <div className="rotulo mb-2">{P.medicao.porEtapa}</div>
              {d.medicao.funil.map((c) => <Barra key={c.id} rotulo={NOME_FUNIL[c.id]} pct={c.pct} />)}
              {d.medicao.economia !== null && <Barra rotulo={P.medicao.economia} pct={d.medicao.economia} apagado />}
            </div>
          </section>

          <div className="grid gap-12 pt-8 lg:grid-cols-2 lg:gap-14">
            {/* 02 · Onde a turma perde */}
            <section>
              <div className="rotulo">{P.perde.rotulo}</div>
              <h2 className="mt-1.5 text-2xl lg:text-3xl">{P.perde.titulo}</h2>
              {frasePerde && <p className={concl}><Rico texto={frasePerde} /></p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-papel/[0.07] p-4">
                  <small className="mb-1.5 block text-sm text-papel/65">{P.perde.acha}</small>
                  <b className="block text-2xl font-medium">{d.acha ? d.acha.rotulo : P.perde.semEtapa}</b>
                  {d.acha && <span className="mt-2 block text-base text-papel/55">{fmt(P.perde.baseAcha, { qtd: d.acha.qtd, total: d.total })}</span>}
                </div>
                <div className="rounded-xl bg-papel p-4 text-tinta">
                  <small className="mb-1.5 block text-sm text-tinta/65">{P.perde.apontam}</small>
                  <b className="block text-2xl font-medium">{topoDado ? (topoDado.empate ? `${P.empate}: ${dadoRotulo}` : dadoRotulo) : P.perde.semEtapa}</b>
                  {topoDado && (
                    <span className="mt-2 block text-base text-tinta/60">
                      {fmt(P.perde.baseDado, { qtd: topoDado.empate ? `${topoDado.qtd} cada` : topoDado.qtd, reais: d.baseEtapas.comNumerosReais })}
                    </span>
                  )}
                </div>
              </div>
              {semApontada > 0 && (
                <p className="mt-3 text-base text-papel/55 lg:text-lg">{semApontada === 1 ? P.perde.umaSemApontada : fmt(P.perde.semApontada, { n: semApontada })}</p>
              )}
            </section>

            {/* 03 · Próximas 4 semanas */}
            <section>
              <div className="rotulo">{P.frente.rotulo}</div>
              <h2 className="mt-1.5 text-2xl lg:text-3xl">{P.frente.titulo}</h2>
              <p className={concl}><Rico texto={fraseFrente} /></p>
              <div className="grid grid-cols-3 gap-3">
                {d.frentes.map((f) => {
                  const lider = f.qtd === maxFrente && maxFrente > 0;
                  return (
                    <div key={f.valor} className={`rounded-xl p-4 text-center ${lider ? "bg-papel text-tinta" : "bg-papel/[0.07]"}`}>
                      <b className="block font-display text-5xl font-normal">{f.qtd}</b>
                      <span className="text-base">{f.rotulo}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-base text-papel/55 lg:text-lg">{P.frente.nota}</p>
            </section>
          </div>

          {(d.dependencia.base > 0 || d.esperadoConseguido) && (
            <div className="mt-10 grid gap-12 border-t border-papel/15 pt-8 lg:grid-cols-2 lg:gap-14">
              {d.dependencia.base > 0 && (
                <section>
                  <div className="rotulo">{P.extra.dependenciaRotulo}</div>
                  <p className={concl}><Rico texto={fmt(P.extra.dependencia, { x: dezDe(d.dependencia.param / d.dependencia.base) })} /></p>
                  <p className="text-base text-papel/55 lg:text-lg">{fmt(P.extra.dependenciaBase, { param: d.dependencia.param, base: d.dependencia.base })}</p>
                </section>
              )}
              {d.esperadoConseguido && (
                <section>
                  <div className="rotulo">{P.extra.esperadoRotulo}</div>
                  <p className={concl}>
                    <Rico texto={fmt(P.extra.esperado, {
                      y: dezDe(d.esperadoConseguido.esperava! / 100),
                      x: dezDe(d.esperadoConseguido.conseguiu! / 100),
                      itens: config.devolutiva.etapas[d.esperadoConseguido.etapa].itens,
                      proxima: config.devolutiva.etapas[d.esperadoConseguido.etapa].proxima,
                    })} />
                  </p>
                  <p className="text-base text-papel/55 lg:text-lg">
                    {fmt(P.extra.esperadoBase, { n: d.esperadoConseguido.n, empresas: d.esperadoConseguido.n === 1 ? "empresa" : "empresas" })}
                  </p>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
