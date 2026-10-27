"use client";

import { useEffect, useState } from "react";
import type { PainelDados } from "../lib/painel";
import { Onda } from "./Marca";
import { config } from "../diagnostico.config";

const NOME_CAMPO: Record<string, string> = {
  A: "Contatos", B: "Atendimentos", C: "Orçamentos", D: "Vendas", E: "Ticket médio", F: "Margem",
  G: "Gasto comercial", H: "Ciclo de venda", I: "Clientes ativos", J: "Cancelamentos", K: "Meses de casa", L: "Recompras",
};

function Secao({ n, titulo, nota, children, className = "" }: { n: string; titulo: string; nota?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-papel/15 pt-6 ${className}`}>
      <div className="rotulo">{n}</div>
      <h2 className="mt-2 text-2xl leading-tight lg:text-3xl">{titulo}</h2>
      {nota && <p className="mt-2 max-w-2xl text-lg text-papel/60">{nota}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Trilho({ pct, cor = "bg-papel", alto = "h-3" }: { pct: number; cor?: string; alto?: string }) {
  return (
    <div className={`${alto} w-full overflow-hidden rounded-full bg-papel/10`}>
      <div className={`${alto} rounded-full ${cor} transition-all duration-700`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

function Kpi({ rotulo, valor, apoio, grande = false }: { rotulo: string; valor: string; apoio?: string; grande?: boolean }) {
  return (
    <div className="min-w-0 py-4 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
      <div className="rotulo">{rotulo}</div>
      <div className={`mt-3 font-display leading-none ${grande ? "text-6xl lg:text-8xl" : "text-3xl lg:text-4xl"}`}>{valor}</div>
      {apoio && <div className="mt-3 text-lg text-papel/60">{apoio}</div>}
    </div>
  );
}

export default function PainelView({ turma }: { turma: string }) {
  const [d, setD] = useState<(PainelDados & { turma: string }) | null>(null);
  const [hora, setHora] = useState("");
  useEffect(() => {
    const carregar = () =>
      fetch(`/api/painel?turma=${encodeURIComponent(turma)}`)
        .then((r) => r.json())
        .then((x) => {
          setD(x);
          setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        })
        .catch(() => {});
    carregar();
    const t = setInterval(carregar, 10000);
    return () => clearInterval(t);
  }, [turma]);

  if (!d) return <main className="min-h-screen bg-tinta p-12 text-3xl text-papel">Carregando...</main>;

  const maxNivel = Math.max(1, ...d.niveis.map((n) => n.qtd));
  const nivelTop = d.niveis.reduce((a, b) => (b.qtd > a.qtd ? b : a), d.niveis[0]);
  const maxPerc = Math.max(1, ...d.percepcaoVsDado.flatMap((p) => [p.percepcao, p.dado]));
  const maxRit = Math.max(1, ...d.rituais.map((r) => r.qtd));
  const campos = d.camposIncertos.filter((c) => c.base > 0);
  const etapaTopo = d.gargaloMaisFrequente;
  const listaE = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}` : xs[0]);
  let contador = 0;
  const num = () => String(++contador).padStart(2, "0");
  const kpis: { rotulo: string; valor: string; apoio?: string; grande?: boolean }[] = [
    { rotulo: "Respostas", valor: String(d.total), apoio: d.total === 1 ? "empresa respondeu" : "empresas responderam", grande: true },
  ];
  if (config.exibicao.maturidade) kpis.push({ rotulo: "Nível mais comum", valor: nivelTop.qtd > 0 ? nivelTop.nome : "-", apoio: nivelTop.qtd > 0 ? `${nivelTop.qtd} de ${d.total}` : undefined });
  if (config.exibicao.margemContraGasto) {
    kpis.push({
      rotulo: "Gasto por venda acima da margem",
      valor: d.economia.baseCalculavel ? `${d.economia.pct}%` : "-",
      apoio: `${d.economia.baseCalculavel === 1 ? "de 1 empresa" : `de ${d.economia.baseCalculavel} empresas`} com conta possível`,
      grande: true,
    });
  }
  kpis.push({ rotulo: "Com números reais", valor: `${d.baseEtapas.comNumerosReais} de ${d.total}`, apoio: "empresas com números reais em alguma etapa do funil" });
  kpis.push({
    rotulo: "Etapa prioritária para investigar",
    valor: etapaTopo ? (etapaTopo.empate ? config.painel.empate : etapaTopo.etapas[0].rotulo) : "-",
    apoio: etapaTopo
      ? etapaTopo.empate
        ? `${listaE(etapaTopo.etapas.map((e) => e.rotulo))}. ${config.painel.empresasCada.replace("{qtd}", String(etapaTopo.qtd))}`
        : `${etapaTopo.qtd} ${etapaTopo.qtd === 1 ? "empresa" : "empresas"} (a mais frequente)`
      : `${d.semGargaloCalculado} sem etapa apontada`,
  });

  return (
    <main className="min-h-screen bg-tinta px-5 py-6 text-papel lg:px-14 lg:py-10">
      <header className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-end lg:justify-between lg:pb-8">
        <div className="flex items-end gap-4 lg:gap-8">
          <Onda className="w-20 lg:w-44" cor="#F2F0EC" />
          <div>
            <div className="rotulo">Diagnóstico comercial · {config.evento}</div>
            <h1 className="mt-2 text-4xl leading-none lg:text-6xl">Turma {d.turma}</h1>
          </div>
        </div>
        <div className="text-sm text-papel/50 lg:text-right lg:text-base">
          Atualiza a cada 10 segundos{hora ? `. Última leitura às ${hora}` : ""}
        </div>
      </header>

      {d.total === 0 ? (
        <div className="border-t border-papel/15 pt-16 text-4xl font-display text-papel/70">Aguardando as primeiras respostas.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 divide-y divide-papel/15 border-t border-papel/15 py-6 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))] lg:divide-x lg:divide-y-0 lg:py-8" style={{ "--cols": kpis.length } as React.CSSProperties}>
            {kpis.map((k) => <Kpi key={k.rotulo} {...k} />)}
          </div>

          <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-12">
            {config.exibicao.conversaoMediana && (
            <Secao n={num()} titulo="Conversão da turma por etapa" nota="A barra é o que a turma informou (mediana). O traço bronze é o que a turma esperava." className="lg:col-span-7">
              <div className="space-y-8">
                {d.conversaoTurma.map((c) => (
                  <div key={c.etapa}>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl">{c.rotulo}</div>
                      <div className="font-display text-4xl">
                        {c.mediana !== null ? `${c.mediana}%` : "-"}
                        <span className="ml-3 font-sans text-lg text-papel/60">esperava {c.medianaEsperada !== null ? `${c.medianaEsperada}%` : "-"}</span>
                      </div>
                    </div>
                    <div className="relative mt-3">
                      <Trilho pct={c.mediana ?? 0} alto="h-5" />
                      {c.medianaEsperada !== null && (
                        <div className="absolute -top-1.5 h-8 w-[3px] bg-bronze" style={{ left: `calc(${Math.min(100, c.medianaEsperada)}% - 1.5px)` }} />
                      )}
                    </div>
                    <div className="mt-2 text-base text-papel/50">
                      {c.n} {c.n === 1 ? "empresa informou" : "empresas informaram"}, {c.nReais} com números reais
                    </div>
                  </div>
                ))}
              </div>
            </Secao>
            )}

            {config.exibicao.maturidade && (
            <Secao n={num()} titulo="Nível de maturidade" className="lg:col-span-5">
              <div className="flex h-72 items-end gap-5">
                {d.niveis.map((n) => (
                  <div key={n.nome} className="flex h-full flex-1 flex-col justify-end">
                    <div className="mb-2 text-center font-display text-5xl">{n.qtd}</div>
                    <div className="w-full rounded-t-sm bg-papel transition-all duration-700" style={{ height: `${Math.max(n.qtd ? 4 : 0, (n.qtd / maxNivel) * 100)}%`, opacity: n.qtd ? 1 : 0.15 }} />
                    <div className="mt-3 h-12 text-center text-lg leading-tight text-papel/80">{n.nome}</div>
                  </div>
                ))}
              </div>
            </Secao>
            )}

            <Secao n={num()} titulo="Onde a turma acha que perde mais, e onde o resultado ficou mais abaixo da expectativa" nota={config.painel.notaPercepcao} className="lg:col-span-7">
              <div className="space-y-6">
                {d.percepcaoVsDado.map((p) => (
                  <div key={p.etapa} className="grid grid-cols-1 items-center gap-2 lg:grid-cols-[14rem_1fr] lg:gap-6">
                    <div className="text-xl first-letter:uppercase">{p.rotulo}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="h-4 flex-1"><div className="h-4 rounded-full border border-papel/60 transition-all duration-700" style={{ width: `${(p.percepcao / maxPerc) * 100}%`, minWidth: p.percepcao ? "1rem" : 0 }} /></div>
                        <span className="w-8 text-right font-display text-2xl">{p.percepcao}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 flex-1"><div className="h-4 rounded-full bg-papel transition-all duration-700" style={{ width: `${(p.dado / maxPerc) * 100}%`, minWidth: p.dado ? "1rem" : 0 }} /></div>
                        <span className="w-8 text-right font-display text-2xl">{p.dado}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-lg text-papel/60">
                Base: {d.total} {d.total === 1 ? "resposta" : "respostas"}, {d.baseEtapas.comNumerosReais} com números reais em alguma etapa. {d.baseEtapas.semEtapaApontada} sem etapa apontada, por estimativa ou porque nenhuma ficou abaixo do esperado.
              </p>
            </Secao>

            <Secao n={num()} titulo="Rituais praticados" className="lg:col-span-5">
              <div className="space-y-5">
                {d.rituais.map((r) => (
                  <div key={r.valor}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xl">
                      <span>{r.rotulo}</span>
                      <span className="font-display text-3xl">{r.qtd}</span>
                    </div>
                    <Trilho pct={(r.qtd / maxRit) * 100} />
                  </div>
                ))}
              </div>
            </Secao>

            <Secao n={num()} titulo="Quanto da turma estimou ou não sabia" nota="Percentual de empresas que não tinham o número real." className="lg:col-span-12">
              <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
                {campos.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xl">
                      <span>{NOME_CAMPO[c.id] ?? c.id}</span>
                      <span className="font-display text-3xl">{c.pct}%</span>
                    </div>
                    <Trilho pct={c.pct} />
                  </div>
                ))}
              </div>
            </Secao>
          </div>
        </>
      )}
    </main>
  );
}
