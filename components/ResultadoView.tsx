"use client";

import { Fragment, useEffect, useState } from "react";
import { Assinatura } from "./Marca";
import { config, type Etapa } from "../diagnostico.config";
import { COMPROMISSO_VAZIO, ETAPAS, type Respostas, type Resultado } from "../lib/calc";
import { fmt, maiuscula, montarDevolutiva, n0, n1, taxa10 } from "../lib/devolutiva";

type Local = { respostas: Respostas; resultado: Resultado };
type Remoto = {
  gargaloCalculado: string | null;
  percepcao: string;
  conversoes?: Record<string, number | null>;
  esperados?: Record<string, number | null>;
  conversaoReal?: Record<string, boolean>;
  contexto: Record<string, string>;
  compromisso: string | Respostas["compromisso"];
  frente?: string;
};

const D = config.devolutiva;

// Texto com **trechos em negrito**.
function Rico({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("**").map((t, i) => (i % 2 === 1 ? <b key={i} className="font-semibold">{t}</b> : <Fragment key={i}>{t}</Fragment>))}
    </>
  );
}

const dataBr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dia = d.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0];
  const base = `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${m[3]}/${m[2]}`;
  return Number(m[1]) === new Date().getFullYear() ? base : `${base}/${m[1]}`;
};
const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export default function ResultadoView({ id }: { id: string }) {
  const [local, setLocal] = useState<Local | null>(null);
  const [remoto, setRemoto] = useState<Remoto | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`resultado:${id}`);
      if (raw) { setLocal(JSON.parse(raw)); return; }
    } catch {}
    fetch(`/api/respostas/${id}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setRemoto).catch(() => setFalhou(true));
  }, [id]);

  // Compromisso e frente: preenchidos aqui, depois do resultado, e gravados na resposta.
  const [rascunho, setRascunho] = useState<Respostas["compromisso"] | null>(null);
  const [frente, setFrente] = useState<string>("");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  if (falhou) return <main className="p-8">Resultado não encontrado.</main>;
  if (!local && !remoto) return <main className="p-8">Carregando...</main>;

  const res = local?.resultado;
  const dev = local && res ? montarDevolutiva(local.respostas, res) : null;
  const gargalo = (res ? res.gargalo : remoto!.gargaloCalculado) as Etapa | null;
  const percepcao = res ? res.percepcao : remoto!.percepcao;
  const pct = (e: Etapa): number | null => (res ? res.conversoes[e].pct : remoto!.conversoes?.[e] ?? null);
  const esperado = (e: Etapa): number | null => (res ? res.conversoes[e].esperado : remoto!.esperados?.[e] ?? null);
  const semDadoReal: Etapa[] = res ? res.etapasSemDadoReal : ETAPAS.filter((e) => remoto!.conversaoReal?.[e] === false);
  const incoerencia = res?.incoerencias[0] ?? null;

  const compBruto = local?.respostas.compromisso ?? remoto!.compromisso;
  const comp: Respostas["compromisso"] = typeof compBruto === "string" ? { ...COMPROMISSO_VAZIO, numero: compBruto } : { ...COMPROMISSO_VAZIO, ...compBruto };
  const compromissoPreenchido = Object.values(comp).some((v) => v.trim() !== "");
  const frenteSalva = local?.respostas.frente ?? remoto?.frente ?? "";
  const sugestao = gargalo ? D.compromisso.sugestao[gargalo] : D.compromisso.sugestaoSemEtapa;
  const emEdicao = editando || !compromissoPreenchido;
  const atual = rascunho ?? { ...comp, numero: comp.numero || sugestao };
  const frenteAtual = frente || frenteSalva;

  async function salvar() {
    setSalvando(true);
    setMsg("");
    const r = await fetch(`/api/respostas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compromisso: atual, frente: frenteAtual }),
    }).catch(() => null);
    setSalvando(false);
    if (!r || !r.ok) { setMsg(D.compromisso.erroSalvar); return; }
    if (local) {
      const novo = { ...local, respostas: { ...local.respostas, compromisso: atual, frente: frenteAtual } };
      setLocal(novo);
      try { localStorage.setItem(`resultado:${id}`, JSON.stringify(novo)); } catch {}
    } else if (remoto) {
      setRemoto({ ...remoto, compromisso: atual, frente: frenteAtual });
    }
    setRascunho(null);
    setEditando(false);
    setMsg(D.compromisso.salvo);
  }

  // Ações da semana: a primeira é da etapa prioritária, quando há uma. Máximo definido no config.
  const acoes = (() => {
    const lista: string[] = incoerencia
      ? [D.semana.conferir]
      : gargalo
        ? [...D.etapas[gargalo].acoes]
        : [semDadoReal.length > 0 ? D.semana.medir : D.semana.escolher];
    const prefixoMedir = config.acoes.medirEtapa.split("{etapas}")[0];
    const economiaEstimada = ["E", "F", "G"].some((k) => local?.respostas.campos[k]?.marca === "estimado");
    for (const bruta of res?.acoes ?? []) {
      if (lista.length >= D.semana.maximo) break;
      if (bruta.startsWith(prefixoMedir) || Object.values(config.acoes.gargalo).includes(bruta)) continue;
      // Ação de economia apoiada em número estimado: primeiro confirmar os números.
      const ehEconomia = bruta === config.acoes.naoPagaAvulsa || bruta === config.acoes.naoPagaVida;
      const a = ehEconomia && economiaEstimada ? D.semana.confirmarEconomia : bruta;
      if (!lista.includes(a)) lista.push(a);
    }
    return lista.slice(0, D.semana.maximo);
  })();

  // Linhas das etapas: com os dados locais usa a conta completa, senão só as razões gravadas.
  const linhasEtapas = dev
    ? dev.etapas
    : ETAPAS.map((e) => {
        const xe = taxa10(pct(e));
        const ye = esperado(e) !== null ? esperado(e)! / 10 : null;
        return { etapa: e, seta: D.etapas[e].seta, naoSeAplica: false, x: xe, y: ye, aviso: null as string | null, mostrar: xe !== null };
      }).filter((l) => l.mostrar);

  // Numeração sequencial: se uma seção não aparece, as seguintes sobem.
  let cont = 0;
  const rot = (t: string) => `${++cont}. ${t.replace(/^\d+\.\s*/, "")}`;

  const card = "mt-3.5 rounded-[10px] border border-nevoa p-[18px]";
  const q = "mb-1 text-[11px] uppercase tracking-[0.24em] text-bronze";
  const nota = "mt-2 text-[12.5px] leading-[1.45] text-grafite/60";
  const alerta = "mt-2.5 border-l-2 border-bronze bg-bronze/10 px-[11px] py-[9px] text-[13.5px] leading-[1.45]";
  const lin = "grid grid-cols-[1fr_auto] items-center gap-1.5 border-t border-nevoa py-[9px] text-[14.5px]";

  const x = gargalo ? taxa10(pct(gargalo)) : null;
  const y = gargalo && esperado(gargalo) !== null ? esperado(gargalo)! / 10 : null;
  const primeiraAcao = acoes[0] ? minuscula(acoes[0]) : null;

  return (
    <main className="mx-auto max-w-[440px] px-4 pb-10 pt-6">
      <div className="flex flex-col items-center gap-3 pb-2"><Assinatura /><div className="rotulo">{config.evento}</div></div>

      {/* 1. Resumo */}
      <section className="mt-3.5 rounded-[10px] border border-tinta bg-tinta p-[18px] text-papel">
        <div className="text-[10.5px] uppercase tracking-[0.28em] text-[#cdb58f]">{rot(D.resumo.rotulo)}</div>
        <h1 className="mb-3.5 mt-2 text-[27px] leading-[1.15] text-papel">
          {incoerencia
            ? D.resumo.incoerente.titulo
            : gargalo
              ? fmt(D.resumo.titulo, { etapa: D.etapas[gargalo].seta })
              : semDadoReal.length > 0
                ? D.resumo.semEtapaEstimado.titulo
                : D.resumo.semEtapaAbaixo.titulo}
        </h1>
        {incoerencia && <p className="mb-2.5 text-[15px] leading-normal">{fmt(D.resumo.incoerente.texto, { posterior: incoerencia.posterior, anterior: incoerencia.anterior })}</p>}
        {!incoerencia && !gargalo && (
          <p className="mb-2.5 text-[15px] leading-normal">{semDadoReal.length > 0 ? D.resumo.semEtapaEstimado.texto : D.resumo.semEtapaAbaixo.texto}</p>
        )}
        {gargalo && x !== null && y !== null && (
          <p className="mb-2.5 text-[15px] leading-normal"><Rico texto={fmt(D.resumo.linhaEtapa, { itens: D.etapas[gargalo].itens, x: n1(x), proxima: D.etapas[gargalo].proxima, y: n1(y) })} /></p>
        )}
        {dev?.pagar && (
          <p className="mb-2.5 text-[15px] leading-normal">
            <Rico texto={fmt(dev.pagar.n === 1 ? D.resumo.linhaPagarUma : D.resumo.linhaPagar, { n: n0(dev.pagar.n), d: n0(dev.pagar.d) })} />
            {dev.pagar.aviso && <span className="ml-1 text-xs text-[#cdb58f]">{dev.pagar.aviso}</span>}
          </p>
        )}
        {dev?.recorrente && (
          <p className="mb-2.5 text-[15px] leading-normal">
            <Rico texto={fmt(D.resumo.linhaRecorrente, { m: dev.recorrente.m })} />
            {dev.recorrente.k !== null && fmt(D.resumo.linhaRecorrenteFica, { k: n1(dev.recorrente.k) })}
            {dev.recorrente.aviso && <span className="ml-1 text-xs text-[#cdb58f]">{dev.recorrente.aviso}</span>}
          </p>
        )}
        {primeiraAcao && <p className="text-[15px] leading-normal">{fmt(D.resumo.linhaSemana, { acao: primeiraAcao })}</p>}
        {res && res.analiseParcial && !incoerencia && (
          <p className="mt-2.5 text-[13px] leading-[1.45] text-papel/70">
            {fmt(D.resumo.parcial, { n: res.etapasComparadas.length, total: ETAPAS.length - res.etapasNaoSeAplica.length })}
          </p>
        )}
      </section>

      {/* 2. Onde você perde vendas? */}
      {(dev?.perde || linhasEtapas.length > 0) && (
        <section className={card}>
          <div className={q}>{rot(D.perde.rotulo)}</div>
          {dev?.perde && (
            <>
              <div className="my-1.5 font-display text-[44px] leading-none">{dev.perde.grande}</div>
              <p className="text-[15px] leading-normal text-grafite">
                {D.perde.texto}
                {dev.perde.c && fmt(D.perde.precisou, { c: dev.perde.c })}
                {dev.perde.e !== null && (dev.perde.e === "menos" ? D.perde.esperavaMenos : fmt(D.perde.esperava, { e: dev.perde.e }))}
              </p>
            </>
          )}
          <div className="mt-3">
            {linhasEtapas.map((l) => {
              const prioridade = gargalo === l.etapa;
              return (
                <div key={l.etapa} className={`${lin} ${prioridade ? "font-semibold" : ""}`}>
                  <span>
                    <span>{maiuscula(l.seta)}</span>
                    {prioridade && <span className="ml-1.5 inline-block rounded-full border border-bronze px-2 text-[11px] font-normal text-bronze">{D.perde.prioridade}</span>}
                  </span>
                  <span className="text-right">
                    {l.naoSeAplica ? (
                      <span className="text-[13px] font-normal text-grafite/60">{D.perde.naoSeAplica}</span>
                    ) : (
                      <>
                        <b className={`font-display text-lg font-normal ${prioridade ? "text-bronze" : ""}`}>{l.x !== null ? n1(l.x) : ""}</b>
                        {" de 10"}
                        {l.y !== null && <em className="font-normal not-italic text-grafite/60"> {fmt(D.perde.esperavaEtapa, { y: n1(l.y) })}</em>}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {dev?.avisoPerde && <p className="mt-2 text-[12.5px] leading-[1.45] text-bronze">{dev.avisoPerde}</p>}
          {gargalo && <p className={nota}>{D.perde.notaPrioridade}</p>}
          {dev?.pequenos ? (
            <div className={alerta}>
              <p>{dev.pequenos}</p>
              <p className="mt-1.5 text-[12.5px] text-grafite/70">{D.perde.notaMes}</p>
            </div>
          ) : (
            <p className={nota}>{D.perde.notaMes}</p>
          )}
          {res?.alertasBase.map((a) => <div key={a} className={alerta}>{a}</div>)}
        </section>
      )}

      {/* 3. Você achava x os números */}
      <section className={card}>
        <div className={q}>{rot(D.achava.rotulo)}</div>
        <div className="mt-2 grid gap-2 text-[14.5px]">
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
            ) : incoerencia ? (
              D.achava.semEtapaConferir
            ) : (
              D.achava.semEtapa
            )}
          </div>
        </div>
        {gargalo && percepcao && percepcao !== "nao_sei" && percepcao !== gargalo && <p className={nota}>{D.achava.diverge}</p>}
      </section>

      {/* Sem os dados locais não há valores nem volumes para as seções 2 (volumes), 4, 5 e 6 */}
      {!local && (
        <section className={card}>
          <p className="text-[13.5px] leading-[1.45] text-grafite/70">{D.semValores}</p>
        </section>
      )}

      {/* 4. Sua venda se paga? */}
      {dev?.mostrarPaga && (
        <section className={card}>
          <div className={q}>{rot(D.paga.rotulo)}</div>
          {(dev.pagar || dev.recorrente) && (
            <div className="my-2 flex gap-2.5">
              {dev.pagar && (
                <>
                  <div className="flex-1 rounded-lg bg-nevoa/45 px-2.5 py-3 text-center">
                    <b className="block font-display text-[30px] font-normal">{n0(dev.pagar.n)}</b>
                    <span className="text-[12.5px] text-grafite/75">{dev.pagar.n === 1 ? D.paga.umaVendaPaga : D.paga.vendasPagam}</span>
                  </div>
                  <div className="flex-1 rounded-lg bg-tinta px-2.5 py-3 text-center text-papel">
                    <b className="block font-display text-[30px] font-normal">{n0(dev.pagar.d)}</b>
                    <span className="text-[12.5px] text-papel/75">{dev.pagar.d === 1 ? D.paga.umaVendaFez : D.paga.vendasFez}</span>
                  </div>
                </>
              )}
              {dev.recorrente && (
                <>
                  <div className="flex-1 rounded-lg bg-nevoa/45 px-2.5 py-3 text-center">
                    <b className="block font-display text-[30px] font-normal">{dev.recorrente.m}</b>
                    <span className="text-[12.5px] text-grafite/75">{D.paga.mesesPagar}</span>
                  </div>
                  {dev.recorrente.k !== null && (
                    <div className="flex-1 rounded-lg bg-tinta px-2.5 py-3 text-center text-papel">
                      <b className="block font-display text-[30px] font-normal">{n1(dev.recorrente.k)}</b>
                      <span className="text-[12.5px] text-papel/75">{D.paga.mesesFica}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {dev.linhas.length > 0 && (
            <div>
              {dev.linhas.map((l) => (
                <div key={l.rotulo} className={`${lin} ${l.destaque ? "text-bronze" : ""}`}>
                  <span>{l.rotulo}</span>
                  <b className="whitespace-nowrap font-display text-lg font-normal">{l.valor}</b>
                </div>
              ))}
            </div>
          )}
          {dev.avisoPaga && <p className="mt-2 text-[12.5px] leading-[1.45] text-bronze">{dev.avisoPaga}</p>}
          {dev.coerencia && <div className={alerta}>{dev.coerencia}</div>}
          {dev.notaCadaVenda && <p className={nota}>{dev.notaCadaVenda}</p>}
          <p className={nota}>{D.paga.notaComissao}</p>
          {dev.notaGastoPorVenda && <p className={nota}>{dev.notaGastoPorVenda}</p>}
        </section>
      )}

      {/* 5. Como sua operação funciona hoje */}
      {dev && dev.operacao.length > 0 && (
        <section className={card}>
          <div className={q}>{rot(D.operacao.rotulo)}</div>
          <p className="mt-0 text-[12.5px] text-grafite/60">{D.operacao.intro}</p>
          <ul className="mt-1">
            {dev.operacao.map((o) => (
              <li key={o.rotulo} className="list-none border-t border-nevoa py-[9px] text-[14.5px]">
                <small className="block text-xs text-grafite/60">{o.rotulo}</small>
                {o.valor}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. O que você ainda não mede */}
      {dev && dev.mede.total > 0 && (
        <section className={card}>
          <div className={q}>{rot(D.mede.rotulo)}</div>
          <p className="text-[15px] leading-normal text-grafite">{dev.mede.texto}</p>
          {dev.mede.naoMedidos.length > 0 && (
            <ul className="mt-1.5">
              {dev.mede.naoMedidos.map((n) => <li key={n} className="list-none border-t border-nevoa py-[9px] text-[14.5px]">{n}</li>)}
            </ul>
          )}
        </section>
      )}

      {/* 7. O que fazer esta semana */}
      <section className={card}>
        <div className={q}>{rot(D.semana.rotulo)}</div>
        <p className="mt-1.5 text-[15px] leading-normal text-grafite">{D.semana.texto}</p>
        {gargalo && (
          <div className="mb-3 mt-3 border-l-2 border-bronze bg-nevoa/40 px-[11px] py-[9px] text-[13.5px] leading-[1.45] text-grafite">
            {D.semana.motivosPrefixo}{D.etapas[gargalo].motivos}
          </div>
        )}
        <ol className="mt-2 list-decimal pl-5">
          {acoes.map((a) => <li key={a} className="mb-2 text-[15px] leading-normal">{a}</li>)}
        </ol>
        <a className="no-print btn mt-1.5 inline-block" href="/controle" target="_blank" rel="noreferrer">{D.semana.botao}</a>
      </section>

      {/* 8. Seu compromisso */}
      <section className={card}>
        <div className={q}>{rot(D.compromisso.rotulo)}</div>
        {emEdicao ? (
          <div className="no-print mt-2 space-y-3">
            <p className="text-[15px] leading-normal text-grafite">{D.compromisso.intro}</p>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{config.frente.pergunta}</legend>
              {config.frente.opcoes.map((o) => (
                <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-2.5 text-[14.5px]">
                  <input type="radio" name="frente" className="h-5 w-5" checked={frenteAtual === o.valor} onChange={() => setFrente(o.valor)} />
                  {o.rotulo}
                </label>
              ))}
            </fieldset>
            {config.compromisso.campos.map((c) => (
              <label key={c.id} className="block">
                <span className="mb-1 block text-sm"><b>{c.rotulo}:</b> {c.pergunta}</span>
                <input className="input" type={c.tipo === "data" ? "date" : "text"} maxLength={200}
                  value={atual[c.id]} onChange={(e) => setRascunho({ ...atual, [c.id]: e.target.value })} />
                {c.id === "numero" && <span className="mt-1 block text-xs text-grafite/60">{D.compromisso.dicaSugestao}</span>}
              </label>
            ))}
            <button className="btn" disabled={salvando} onClick={salvar}>{salvando ? D.compromisso.salvando : D.compromisso.salvar}</button>
            {msg && <p className="text-sm text-bronze">{msg}</p>}
          </div>
        ) : (
          <>
            <div className="mb-2 mt-2 border-l-2 border-bronze bg-nevoa/40 px-3 py-2.5">
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
            {msg && <p className="no-print mt-2 text-sm text-bronze">{msg}</p>}
            <button className="no-print btn-sec mt-2" onClick={() => { setEditando(true); setMsg(""); }}>{D.compromisso.editar}</button>
          </>
        )}
        {/* No PDF sem compromisso salvo, sai o texto para escrever no papel. */}
        {emEdicao && <p className="hidden text-[15px] leading-normal text-grafite print:block">{D.compromisso.semPreencher}</p>}
        {dev?.ciclo && <div className={alerta}>{dev.ciclo}</div>}
      </section>

      {/* 9. Quando refazer */}
      <section className="mt-3.5 rounded-[10px] border-2 border-tinta p-[18px]">
        <div className={q}>{rot(D.refazer.rotulo)}</div>
        <p className="mt-1.5 text-[15px] leading-normal text-grafite">
          <Rico texto={comp.revisao ? fmt(D.refazer.comData, { data: minuscula(dataBr(comp.revisao)) }) : D.refazer.semData} />
        </p>
        <button className="no-print btn mt-2" onClick={() => window.print()}>{D.refazer.pdf}</button>
      </section>
    </main>
  );
}
