"use client";

import { useEffect, useState } from "react";
import { Assinatura } from "./Marca";
import { config, type Etapa } from "../diagnostico.config";
import { COMPROMISSO_VAZIO, ETAPAS, brl, pagamentoEfetivo, pct1, type Respostas, type Resultado } from "../lib/calc";

type Local = { respostas: Respostas; resultado: Resultado };
type Remoto = {
  gargaloCalculado: string | null;
  percepcao: string;
  conversoes?: Record<string, number | null>;
  esperados?: Record<string, number | null>;
  conversaoReal?: Record<string, boolean>;
  contexto: Record<string, string>;
  compromisso: string | Respostas["compromisso"];
};

const D = config.devolutiva;
const fmt = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
// Razão em porcentagem para "x de cada 10", inteiro de 0 a 10.
const deCadaDez = (pct: number | null) => (pct === null ? null : Math.max(0, Math.min(10, Math.round(pct / 10))));
const dataBr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dia = d.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0];
  const base = `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${m[3]}/${m[2]}`;
  return Number(m[1]) === new Date().getFullYear() ? base : `${base}/${m[1]}`;
};

export default function ResultadoView({ id }: { id: string }) {
  const [local, setLocal] = useState<Local | null>(null);
  const [remoto, setRemoto] = useState<Remoto | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`resultado:${id}`);
      if (raw) { setLocal(JSON.parse(raw)); return; }
    } catch {}
    fetch(`/api/respostas/${id}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setRemoto).catch(() => setFalhou(true));
  }, [id]);

  if (falhou) return <main className="p-8">Resultado não encontrado.</main>;
  if (!local && !remoto) return <main className="p-8">Carregando...</main>;

  const res = local?.resultado;
  const gargalo = (res ? res.gargalo : remoto!.gargaloCalculado) as Etapa | null;
  const percepcao = res ? res.percepcao : remoto!.percepcao;
  const contexto = local?.respostas.contexto ?? remoto!.contexto;
  const pag = pagamentoEfetivo(contexto);
  const pct = (e: Etapa): number | null => (res ? res.conversoes[e].pct : remoto!.conversoes?.[e] ?? null);
  const esperado = (e: Etapa): number | null => (res ? res.conversoes[e].esperado : remoto!.esperados?.[e] ?? null);
  const semDadoReal: Etapa[] = res ? res.etapasSemDadoReal : ETAPAS.filter((e) => remoto!.conversaoReal?.[e] === false);
  const naoSeAplica: Etapa[] = res ? res.etapasNaoSeAplica : [];

  const compBruto = local?.respostas.compromisso ?? remoto!.compromisso;
  const comp: Respostas["compromisso"] = typeof compBruto === "string" ? { ...COMPROMISSO_VAZIO, numero: compBruto } : { ...COMPROMISSO_VAZIO, ...compBruto };
  const compromissoPreenchido = Object.values(comp).some((v) => v.trim() !== "");

  // No máximo duas ações. A primeira é da etapa prioritária, quando há uma.
  const acoes = (() => {
    const lista: string[] = gargalo ? [...D.etapas[gargalo].acoes] : [semDadoReal.length > 0 ? D.acoes.medir : D.acoes.escolher];
    // Ações do cálculo que já estão cobertas acima (a da etapa e a de medir etapas) ficam de fora.
    const prefixoMedir = config.acoes.medirEtapa.split("{etapas}")[0];
    for (const a of res?.acoes ?? []) {
      if (lista.length >= D.acoes.maximo) break;
      if (a.startsWith(prefixoMedir) || Object.values(config.acoes.gargalo).includes(a)) continue;
      if (!lista.includes(a)) lista.push(a);
    }
    return lista.slice(0, D.acoes.maximo);
  })();

  // Funil que não afunila: o card do topo não aponta etapa e pede para conferir os números.
  const incoerencia = res?.incoerencias[0] ?? null;

  const funil = local ? ["A", "B", "C", "D"].map((k, i) => ({ nome: D.detalhe.funilItens[i], campo: local.respostas.campos[k] })) : [];
  const maxFunil = Math.max(1, ...funil.map((f) => f.campo?.valor ?? 0));
  const estimou = local ? ["D", "E", "F", "G"].some((k) => local.respostas.campos[k]?.marca === "estimado") : false;
  const dif = res?.diferencaMes ?? null;

  const card = "mt-3.5 rounded-[10px] border border-nevoa p-[18px]";
  const linha = "flex items-baseline justify-between gap-3 border-t border-nevoa py-2 text-[14.5px]";

  return (
    <main className="mx-auto max-w-[440px] px-4 pb-10 pt-6">
      <div className="flex flex-col items-center gap-3 pb-2"><Assinatura /><div className="rotulo">{config.evento}</div></div>

      {/* 1. Seu diagnóstico */}
      <section className={`${card} border-2 border-tinta`}>
        <div className="rotulo">{D.diagnostico.rotulo}</div>
        {incoerencia ? (
          <>
            <h1 className="mb-3.5 mt-2 text-[27px] leading-[1.15]">{D.diagnostico.incoerente.titulo}</h1>
            <p className="text-[15px] leading-normal text-grafite">{fmt(D.diagnostico.incoerente.texto, { posterior: incoerencia.posterior, anterior: incoerencia.anterior })}</p>
          </>
        ) : gargalo ? (
          <>
            <h1 className="mb-3.5 mt-2 text-[27px] leading-[1.15]">{fmt(D.diagnostico.titulo, { etapa: D.etapas[gargalo].seta })}</h1>
            {deCadaDez(pct(gargalo)) !== null && esperado(gargalo) !== null && (
              <div className="mb-3.5 flex gap-2.5">
                <div className="flex-1 rounded-lg bg-tinta px-2.5 py-3 text-center text-papel">
                  <b className="block font-display text-[34px] font-normal leading-none">{deCadaDez(pct(gargalo))}</b>
                  <span className="text-[12.5px] text-papel/80">{fmt(D.diagnostico.cadaDez, { itens: D.etapas[gargalo].itens, proxima: D.etapas[gargalo].proxima })}</span>
                </div>
                <div className="flex-1 rounded-lg bg-nevoa/45 px-2.5 py-3 text-center">
                  <b className="block font-display text-[34px] font-normal leading-none">{esperado(gargalo)! / 10}</b>
                  <span className="text-[12.5px] text-grafite/75">{D.diagnostico.esperava}</span>
                </div>
              </div>
            )}
            <p className="text-[15px] leading-normal text-grafite">{D.diagnostico.texto}</p>
            <div className="mt-3 border-l-2 border-bronze bg-nevoa/40 px-[11px] py-[9px] text-[13.5px] leading-[1.45] text-grafite">
              {D.diagnostico.motivosPrefixo}{D.etapas[gargalo].motivos}
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-3.5 mt-2 text-[27px] leading-[1.15]">
              {semDadoReal.length > 0 ? D.diagnostico.semEtapaEstimado.titulo : D.diagnostico.semEtapaAbaixo.titulo}
            </h1>
            <p className="text-[15px] leading-normal text-grafite">
              {semDadoReal.length > 0 ? D.diagnostico.semEtapaEstimado.texto : D.diagnostico.semEtapaAbaixo.texto}
            </p>
          </>
        )}
        {res && res.analiseParcial && (
          <p className="mt-3 text-[13px] leading-[1.45] text-grafite/75">
            {fmt(D.diagnostico.parcial, { n: res.etapasComparadas.length, total: ETAPAS.length - res.etapasNaoSeAplica.length })}
          </p>
        )}
      </section>

      {/* 2. O que fazer esta semana */}
      {acoes.length > 0 && (
        <section className={card}>
          <h2 className="mb-2.5 text-[21px]">{D.acoes.titulo}</h2>
          <ol className="list-decimal pl-5">
            {acoes.map((a) => <li key={a} className="mb-2 text-[15px] leading-normal">{a}</li>)}
          </ol>
          <a className="no-print btn mt-1.5 inline-block" href="/controle" target="_blank" rel="noreferrer">{D.acoes.botao}</a>
        </section>
      )}

      {/* 3. Você achava x os números */}
      <section className={card}>
        <h2 className="mb-2.5 text-[21px]">{D.achava.titulo}</h2>
        <div className="grid gap-2 text-[14.5px]">
          <div className="rounded-lg bg-nevoa/40 px-3 py-2.5">
            {percepcao === "nao_sei" || !percepcao ? (
              D.achava.naoSabia
            ) : (
              <>
                <small className="mb-0.5 block text-[11.5px] text-grafite/70">{D.achava.achava}</small>
                {D.setaPercepcao[percepcao] ?? percepcao}
              </>
            )}
          </div>
          <div className="rounded-lg bg-tinta px-3 py-2.5 text-papel">
            {gargalo ? (
              <>
                <small className="mb-0.5 block text-[11.5px] text-papel/75">{D.achava.apontam}</small>
                {D.etapas[gargalo].seta}
              </>
            ) : (
              D.achava.semEtapa
            )}
          </div>
        </div>
      </section>

      {/* 4. Seu compromisso */}
      <section className={card}>
        <h2 className="mb-2.5 text-[21px]">{D.compromisso.titulo}</h2>
        {compromissoPreenchido ? (
          <>
            <div className="mb-2 border-l-2 border-bronze bg-nevoa/40 px-3 py-2.5">
              <div className="rotulo">{D.compromisso.numero}</div>
              <b className="mt-0.5 block font-display text-[19px] font-normal">{comp.numero || D.compromisso.naoDefinido}</b>
            </div>
            <dl>
              {(["fonte", "responsavel", "revisao", "decisao", "conclusao"] as const).map((k) => (
                <div key={k} className="grid grid-cols-[7.2rem_1fr] gap-2.5 border-t border-nevoa py-2 text-sm">
                  <dt className="text-grafite/70">{D.compromisso.rotulos[k]}</dt>
                  <dd>{comp[k] ? (k === "revisao" ? dataBr(comp[k]) : comp[k]) : <span className="text-grafite/50">{D.compromisso.naoPreenchido}</span>}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="text-[15px] leading-normal text-grafite">{D.compromisso.semPreencher}</p>
        )}
      </section>

      {/* 5. Seus números em detalhe */}
      <section className={card}>
        <button type="button" className="no-print flex w-full items-center justify-between text-left font-display text-xl" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          {D.detalhe.titulo}
          <i className="font-sans text-[13px] not-italic text-bronze">{aberto ? D.detalhe.fechar : D.detalhe.ver}</i>
        </button>
        <div className="hidden font-display text-xl print:block">{D.detalhe.titulo}</div>
        <div className={`mt-3 ${aberto ? "block" : "hidden print:block"}`}>
          {local && (
            <>
              <div className="rotulo mb-1.5">{D.detalhe.funil}</div>
              {funil.map((f) => (
                <div key={f.nome} className="my-1.5 flex items-center gap-2 text-[13.5px]">
                  <span className="w-24 shrink-0 text-grafite/75">{f.nome}</span>
                  {f.campo?.marca === "nao_se_aplica" ? (
                    <span className="text-grafite/60">{D.detalhe.naoSeAplica}</span>
                  ) : f.campo?.valor === null || f.campo?.valor === undefined ? (
                    <span className="text-grafite/60">{D.detalhe.semDado}</span>
                  ) : (
                    <div className="h-[22px] rounded bg-grafite pl-[7px] text-xs leading-[22px] text-papel" style={{ width: `${Math.max(9, (f.campo.valor / maxFunil) * 100)}%` }}>{f.campo.valor}</div>
                  )}
                </div>
              ))}
            </>
          )}
          <div className="mt-2.5">
            {ETAPAS.map((e) => {
              const x = deCadaDez(pct(e));
              const y = esperado(e) !== null ? esperado(e)! / 10 : null;
              const destaque = gargalo === e;
              return (
                <div key={e} className={`${linha} flex-wrap ${destaque ? "font-semibold text-bronze" : ""}`}>
                  <span className="whitespace-nowrap first-letter:uppercase">{D.etapas[e].seta}</span>
                  <span className="whitespace-nowrap">
                    {naoSeAplica.includes(e) ? (
                      <em className="font-normal not-italic text-grafite/60">{D.detalhe.naoSeAplica}</em>
                    ) : x === null ? (
                      <em className="font-normal not-italic text-grafite/60">{D.detalhe.indisponivel}</em>
                    ) : (
                      <>
                        {fmt(D.detalhe.cadaDez, { x })}
                        {y !== null && <em className="font-normal not-italic text-grafite/60"> · {fmt(D.detalhe.esperava, { y })}</em>}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.45] text-grafite/60">{D.detalhe.notaMes}</p>
          {res?.alertasBase.map((a) => <p key={a} className="mt-2 border-l-2 border-bronze bg-nevoa/40 p-2 text-[12.5px] leading-[1.45]">{a}</p>)}

          {res && (
            <>
              <div className="rotulo mb-1.5 mt-[18px]">{D.detalhe.economia}</div>
              <div>
                <div className={linha}><span>{D.detalhe.porVenda}</span><b className="font-display text-lg font-normal">{res.lucroVenda !== null ? brl(res.lucroVenda) : "-"}</b></div>
                <div className={linha}><span>{D.detalhe.noMes}</span><b className="font-display text-lg font-normal">{res.contribuicaoMes !== null ? brl(res.contribuicaoMes) : "-"}</b></div>
                <div className={linha}><span>{D.detalhe.custo}</span><b className="font-display text-lg font-normal">{res.gastoMes !== null ? brl(res.gastoMes) : "-"}</b></div>
                {dif !== null ? (
                  <div className={`${linha} ${dif < 0 ? "text-bronze" : ""}`}>
                    <span>{dif < 0 ? D.detalhe.faltaram : D.detalhe.sobraram}</span>
                    <b className="font-display text-lg font-normal">{brl(Math.abs(dif))}</b>
                  </div>
                ) : (
                  <div className={linha}><span>{D.detalhe.naoCalculavel}</span></div>
                )}
                {pag !== "avulsa" && (
                  <div className={linha}><span>{D.detalhe.vida}</span><b className="font-display text-lg font-normal">{res.lucroVida !== null ? brl(res.lucroVida) : "-"}</b></div>
                )}
                {pag === "recorrente" && (
                  <div className={linha}><span>{D.detalhe.churn}</span><b className="font-display text-lg font-normal">{res.churn !== null ? pct1(res.churn) : "-"}</b></div>
                )}
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.45] text-grafite/60">
                {D.detalhe.notaComissao}
                <br />
                {res.gastoPorVenda !== null ? fmt(D.detalhe.notaGastoPorVenda, { valor: brl(res.gastoPorVenda) }) : D.detalhe.notaGastoPorVendaIndisponivel}
              </p>
              {estimou && <p className="mt-2 text-[12.5px] leading-[1.45] text-grafite/60">{D.detalhe.estimado}</p>}
            </>
          )}
          {!local && <p className="mt-3 text-[12.5px] leading-[1.45] text-grafite/60">{D.semValores}</p>}
        </div>
      </section>

      {/* 6. PDF */}
      <div className="no-print mt-[18px] text-center">
        <button className="btn" onClick={() => window.print()}>{D.pdf}</button>
      </div>
    </main>
  );
}
