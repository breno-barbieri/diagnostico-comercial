"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "../diagnostico.config";
import { COMPROMISSO_VAZIO, ETAPAS, calcular, camposAplicaveis, pagamentoEfetivo, type Campo, type Marca, type Respostas } from "../lib/calc";
import { montarRegistro } from "../lib/registro";
import { Assinatura } from "./Marca";

// Quatro blocos de perguntas. O compromisso fica na tela de resultado, depois de ver o diagnóstico. A identificação é opcional e fica antes da contagem.
const ETAPAS_FORM = ["Identificação", "Contexto e percepção", "Funil", "Economia da venda", "Rotina"];

const unidadeSufixo: Record<string, string> = { numero: "", reais: "R$", pct: "%", dias: "dias", meses: "meses", vezes: "vezes" };

export default function Formulario({ turma }: { turma: string }) {
  const router = useRouter();
  const inicio = config.identificacaoAtiva ? 0 : 1;
  const [passo, setPasso] = useState(inicio);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [r, setR] = useState<Respostas>({
    identificacao: { nome: "", empresa: "", cargo: "", email: "", whatsapp: "", faturamento: "" },
    consentimento: false,
    turma,
    contexto: {},
    percepcao: "",
    expectativas: {},
    campos: {},
    ponte: { rituais: [], clienteIdeal: "", clienteIdealTexto: "", dependencia: "", registro: "" },
    gargalosConfirmados: [],
    compromisso: { ...COMPROMISSO_VAZIO },
    frente: "",
  });

  const pagamento = pagamentoEfetivo(r.contexto);
  const resultado = useMemo(() => calcular(r), [r]);

  const setCampo = (id: string, p: Partial<Campo>) =>
    setR((s) => {
      const atual = s.campos[id] ?? { valor: null, marca: null };
      const novo = { ...atual, ...p };
      if (novo.marca === "desconhecido" || novo.marca === "nao_se_aplica") novo.valor = null;
      return { ...s, campos: { ...s.campos, [id]: novo } };
    });

  function validar(): string {
    if (passo === 0) {
      const identificado = Object.values(r.identificacao).some((x) => x.trim() !== "");
      if (identificado && !r.consentimento) return "Marque a autorização para enviar seus dados de identificação, ou apague os campos preenchidos.";
    }
    if (passo === 1) {
      for (const q of config.contexto) if (!r.contexto[q.id]) return "Responda as três perguntas.";
      if (r.contexto.pagamento === "misto" && !r.contexto.operacao) return "Escolha a operação sobre a qual você vai responder.";
    }
    if (passo === 1) {
      if (!r.percepcao) return "Escolha onde você acha que mais perde cliente.";
      for (const e of ETAPAS) {
        const x = r.expectativas[e];
        if (x === null || x === undefined || Number.isNaN(x) || x < 0 || x > 10) return "Responda as três expectativas com um número de 0 a 10.";
      }
    }
    if (passo === 2 || passo === 3) {
      const bloco = passo === 2 ? "funil" : "economia";
      for (const c of camposAplicaveis(pagamento).filter((x) => x.bloco === bloco)) {
        const v = r.campos[c.id];
        if (!v?.marca) return `Campo ${c.id}: escolha uma das marcações.`;
        if (v.marca !== "desconhecido" && v.marca !== "nao_se_aplica" && (v.valor === null || Number.isNaN(v.valor) || v.valor < 0))
          return `Campo ${c.id}: informe o número.`;
      }
    }
    if (passo === 4) {
      if (r.ponte.rituais.length === 0) return "Escolha ao menos um ritual (ou Nenhum).";
      if (!r.ponte.clienteIdeal) return "Responda sobre o cliente ideal.";
      if (!r.ponte.dependencia) return "Responda o que acontece se quem mais vende sair.";
      if (!r.ponte.registro) return "Responda onde ficam anotadas as suas vendas.";
    }
    return "";
  }

  function avancar() {
    const e = validar();
    setErro(e);
    if (e) return;
    setPasso(passo + 1);
    window.scrollTo(0, 0);
  }

  async function enviar() {
    const e = validar();
    setErro(e);
    if (e) return;
    setEnviando(true);
    const reg = montarRegistro(r, resultado);
    const resp = await fetch("/api/respostas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reg) });
    if (!resp.ok) {
      setErro("Não foi possível salvar. Tente de novo.");
      setEnviando(false);
      return;
    }
    const { id } = await resp.json();
    // Valores em reais e volumes ficam só neste navegador, para montar o resultado completo.
    try {
      localStorage.setItem(`resultado:${id}`, JSON.stringify({ respostas: { ...r, identificacao: undefined }, resultado }));
    } catch {}
    router.push(`/resultado/${id}`);
  }

  const toggle = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  return (
    <main className="form-telao mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-col items-center gap-3"><Assinatura /><div className="rotulo">{config.evento}</div></div>
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-grafite/75">
          <span className="rotulo">{ETAPAS_FORM[passo]}</span>
          <span>{passo === 0 ? "Antes de começar" : `${passo} de ${ETAPAS_FORM.length - 1}`}</span>
        </div>
        <div className="h-1 rounded-full bg-nevoa">
          <div className="h-1 rounded-full bg-tinta transition-all" style={{ width: `${(passo / (ETAPAS_FORM.length - 1)) * 100}%` }} />
        </div>
      </div>

      <div className="card space-y-5">
        {passo === 0 && (
          <>
            <h1 className="text-2xl">Diagnóstico comercial</h1>
            <p className="text-grafite/75">{config.avisoIdentificacao}</p>
            {(["nome", "empresa", "cargo"] as const).map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-sm capitalize">{k}</span>
                <input className="input" value={r.identificacao[k]} onChange={(e) => setR({ ...r, identificacao: { ...r.identificacao, [k]: e.target.value } })} />
              </label>
            ))}
            {Object.values(r.identificacao).some((x) => x.trim() !== "") && (
              <label className="flex items-start gap-3 rounded-lg bg-nevoa/40 p-3">
                <input type="checkbox" className="mt-1 h-5 w-5" checked={r.consentimento} onChange={(e) => setR({ ...r, consentimento: e.target.checked })} />
                <span className="text-sm">{config.consentimento}</span>
              </label>
            )}
          </>
        )}

        {passo === 1 && config.contexto.map((q) => (
          <fieldset key={q.id} className="grid gap-2">
            <legend className="mb-1 font-medium">{q.pergunta}</legend>
            {q.opcoes.map((o) => (
              <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                <input type="radio" name={q.id} className="h-5 w-5" checked={r.contexto[q.id] === o.valor} onChange={() => setR({ ...r, contexto: { ...r.contexto, [q.id]: o.valor } })} />
                {o.rotulo}
              </label>
            ))}
          </fieldset>
        ))}
        {passo === 1 && r.contexto.pagamento === "misto" && (
          <fieldset className="grid gap-2 border-l-2 border-bronze pl-4">
            <legend className="mb-1 font-medium">{config.operacaoMista.pergunta}</legend>
            {config.operacaoMista.opcoes.map((v) => {
              const o = config.contexto[0].opcoes.find((x) => x.valor === v)!;
              return (
                <label key={v} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                  <input type="radio" name="operacao" className="h-5 w-5" checked={r.contexto.operacao === v} onChange={() => setR({ ...r, contexto: { ...r.contexto, operacao: v } })} />
                  {o.rotulo}
                </label>
              );
            })}
          </fieldset>
        )}

        {passo === 1 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 font-medium">{config.percepcao.pergunta}</legend>
            <p className="text-sm text-grafite/75">Responda antes de ver os números.</p>
            {config.percepcao.opcoes.map((o) => (
              <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                <input type="radio" name="percepcao" className="h-5 w-5" checked={r.percepcao === o.valor} onChange={() => setR({ ...r, percepcao: o.valor })} />
                {o.rotulo}
              </label>
            ))}
          </fieldset>
        )}
        {passo === 1 && (
          <fieldset className="grid gap-3">
            <legend className="mb-1 font-medium">{config.expectativas.titulo}</legend>
            <p className="text-sm text-grafite/75">{config.textos.expectativaRegua}</p>
            {ETAPAS.map((e) => (
              <label key={e} className="block rounded-lg border border-nevoa p-3">
                <span className="mb-2 block text-sm">{config.expectativas.perguntas[e]}</span>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="numeric" min={0} max={10} className="input w-24"
                    value={r.expectativas[e] ?? ""}
                    onChange={(ev) => setR({ ...r, expectativas: { ...r.expectativas, [e]: ev.target.value === "" ? null : Number(ev.target.value) } })} />
                  <span className="text-grafite/75">de cada 10</span>
                </div>
              </label>
            ))}
          </fieldset>
        )}

        {(passo === 2 || passo === 3) && (
          <>
            <h2 className="text-xl">{passo === 2 ? "Funil do último mês" : "Economia da venda"}</h2>
            {passo === 2 && <p className="border-l-2 border-bronze pl-3 text-sm text-grafite/75">{config.textos.funilMensal}</p>}
            <div className="grid gap-3">
            {camposAplicaveis(pagamento).filter((c) => c.bloco === (passo === 2 ? "funil" : "economia")).map((c) => {
              const v = r.campos[c.id] ?? { valor: null, marca: null };
              const off = v.marca === "desconhecido" || v.marca === "nao_se_aplica";
              return (
                <div key={c.id} className="space-y-2 rounded-lg border border-nevoa p-3">
                  <div className="font-medium">{c.id}. {c.rotulo}</div>
                  {c.ajuda && <p className="text-sm text-grafite/75">{c.ajuda}</p>}
                  {c.saibaMais && (
                    <details className="text-sm text-grafite/75">
                      <summary className="cursor-pointer text-bronze">Saiba mais</summary>
                      <p className="mt-1">{c.saibaMais}</p>
                    </details>
                  )}
                  <div className="flex items-center gap-2">
                    {unidadeSufixo[c.unidade] === "R$" && <span>R$</span>}
                    <input type="number" inputMode="decimal" min={0} className="input disabled:bg-nevoa/50" disabled={off}
                      value={v.valor ?? ""} onChange={(e) => setCampo(c.id, { valor: e.target.value === "" ? null : Number(e.target.value) })} />
                    {unidadeSufixo[c.unidade] && unidadeSufixo[c.unidade] !== "R$" && <span className="text-grafite/75">{unidadeSufixo[c.unidade]}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(c.permiteNaoSeAplica ? [...config.marcacoes, config.marcacaoNaoSeAplica] : config.marcacoes).map((m) => (
                      <label key={m.valor} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${v.marca === m.valor ? "border-tinta bg-tinta text-papel" : "border-grafite/30"}`}>
                        <input type="radio" className="sr-only" name={`m-${c.id}`} checked={v.marca === m.valor} onChange={() => setCampo(c.id, { marca: m.valor as Marca })} />
                        {m.rotulo}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            </div>
            {passo === 2 && resultado.alertasBase.map((a) => (
              <p key={a} className="border-l-2 border-bronze bg-nevoa/40 p-3 text-sm">{a}</p>
            ))}
          </>
        )}

        {passo === 4 && (
          <>
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-medium">{config.ponte.rituais.pergunta}</legend>
              {config.ponte.rituais.opcoes.map((o) => (
                <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                  <input type="checkbox" className="h-5 w-5" checked={r.ponte.rituais.includes(o.valor)}
                    onChange={() => {
                      const rituais = o.valor === "nenhum" ? (r.ponte.rituais.includes("nenhum") ? [] : ["nenhum"]) : toggle(r.ponte.rituais.filter((x) => x !== "nenhum"), o.valor);
                      setR({ ...r, ponte: { ...r.ponte, rituais } });
                    }} />
                  {o.rotulo}
                </label>
              ))}
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-medium">{config.ponte.clienteIdeal.pergunta}</legend>
              {(["sim", "nao"] as const).map((v) => (
                <label key={v} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                  <input type="radio" name="ideal" className="h-5 w-5" checked={r.ponte.clienteIdeal === v} onChange={() => setR({ ...r, ponte: { ...r.ponte, clienteIdeal: v } })} />
                  {v === "sim" ? "Sim" : "Não"}
                </label>
              ))}
              {r.ponte.clienteIdeal === "sim" && (
                <input className="input" placeholder={config.ponte.clienteIdeal.textoLabel} value={r.ponte.clienteIdealTexto} onChange={(e) => setR({ ...r, ponte: { ...r.ponte, clienteIdealTexto: e.target.value } })} />
              )}
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-medium">{config.ponte.dependencia.pergunta}</legend>
              {config.ponte.dependencia.opcoes.map((o) => (
                <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                  <input type="radio" name="dep" className="h-5 w-5" checked={r.ponte.dependencia === o.valor} onChange={() => setR({ ...r, ponte: { ...r.ponte, dependencia: o.valor } })} />
                  {o.rotulo}
                </label>
              ))}
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-medium">{config.ponte.registro.pergunta}</legend>
              {config.ponte.registro.opcoes.map((o) => (
                <label key={o.valor} className="flex items-center gap-3 rounded-lg border border-nevoa p-3">
                  <input type="radio" name="registro" className="h-5 w-5" checked={r.ponte.registro === o.valor} onChange={() => setR({ ...r, ponte: { ...r.ponte, registro: o.valor } })} />
                  {o.rotulo}
                </label>
              ))}
            </fieldset>
          </>
        )}

        {erro && <p className="rounded-lg border-l-2 border-bronze bg-nevoa/40 p-3 text-sm text-tinta">{erro}</p>}

        <div className="flex justify-between pt-2">
          <button className="btn-sec" disabled={passo === inicio} onClick={() => { setErro(""); setPasso(passo - 1); }}>Voltar</button>
          {passo < ETAPAS_FORM.length - 1 ? (
            <button className="btn" onClick={avancar}>Continuar</button>
          ) : (
            <button className="btn" disabled={enviando} onClick={enviar}>{enviando ? "Enviando..." : "Ver meu resultado"}</button>
          )}
        </div>
      </div>
    </main>
  );
}
