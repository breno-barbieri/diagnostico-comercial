import { config } from "../../diagnostico.config";
import PrintButton from "../../components/PrintButton";
import { Onda } from "../../components/Marca";

const caixa = <span className="inline-block h-7 w-28 border-b border-tinta align-bottom" />;

export default function Folha() {
  const cod = (id: string) => config.campos.filter((c) => c.id === id)[0];
  const formulas: Record<string, string> = {
    "Contato para atendimento": "B ÷ A = ____%",
    "Atendimento para orçamento": "C ÷ B = ____%",
    "Orçamento para venda": "D ÷ C = ____%",
    "Contato para venda": "D ÷ A = ____%",
    "Contribuição por venda": "E × F = R$ ______",
    "Contribuição do mês": "D × E × F = R$ ______",
    "Diferença do mês": "contribuição do mês − gasto comercial (G) = R$ ______",
    "Gasto comercial por venda (não é CAC)": "G ÷ D = R$ ______",
    "Margem de contribuição do cliente na vida (recorrente)": "E × F × K = R$ ______",
    "Margem de contribuição do cliente na vida (avulsa com recompra)": "E × F × L = R$ ______",
    "Churn mensal (recorrente)": "J ÷ I = ____%",
  };
  void cod;
  return (
    <main className="mx-auto max-w-[190mm] space-y-5 bg-papel p-6 text-[13px] leading-6 print:p-0">
      <div className="no-print flex justify-end"><PrintButton /></div>
      <div className="flex items-end gap-4"><Onda className="w-24 text-tinta" /><div><div className="rotulo">{config.evento}</div><h1 className="text-2xl">Diagnóstico comercial</h1></div></div>
      <p>Nome: ____________________________ Empresa: ____________________________</p>

      <section className="space-y-1">
        <h2 className="border-b border-bronze/60 pb-0.5 text-base">Bloco 0: Contexto</h2>
        {config.contexto.map((q) => (
          <div key={q.id}><b>{q.pergunta}</b> {q.opcoes.map((o) => `( ) ${o.rotulo}`).join("   ")}</div>
        ))}
        <div className="text-grafite/75">{config.operacaoMista.pergunta} ( ) Recorrente  ( ) Avulsa  ( ) Avulsa com recompra</div>
      </section>

      <section className="space-y-1">
        <h2 className="border-b border-bronze/60 pb-0.5 text-base">Bloco 1: Percepção (responda antes dos números)</h2>
        <div><b>{config.percepcao.pergunta}</b></div>
        <div>{config.percepcao.opcoes.map((o) => `( ) ${o.rotulo}`).join("   ")}</div>
        <div className="pt-1"><b>{config.expectativas.titulo}</b></div>
        {Object.values(config.expectativas.perguntas).map((q) => <div key={q}>{q} ____ de cada 10</div>)}
      </section>

      {(["funil", "economia"] as const).map((b) => (
        <section key={b} className="space-y-1">
          <h2 className="border-b border-bronze/60 pb-0.5 text-base">{b === "funil" ? "Bloco 2: Funil (último mês)" : "Bloco 3: Economia da venda"}</h2>
          <div className="text-[11px] leading-4 text-grafite/75">{b === "funil" ? config.textos.funilMensal : config.textos.notaGastoComercial}</div>
          {config.campos.filter((c) => c.bloco === b).map((c) => (
            <div key={c.id}>
              <b>{c.id}.</b> {c.rotulo}{c.somenteRecorrente ? " (só recorrente ou misto)" : ""}{c.somenteRecompra ? " (só venda avulsa com recompra)" : ""}{c.rotulo.endsWith("?") ? " " : ": "}{caixa}
              <span className="ml-2">( ) Real  ( ) Estimado  ( ) Não tenho como saber{c.permiteNaoSeAplica ? "  ( ) Não se aplica" : ""}</span>
              {c.ajuda && <div className="text-[11px] leading-4 text-grafite/75">{c.ajuda}</div>}
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-1">
        <h2 className="border-b border-bronze/60 pb-0.5 text-base">Cálculos</h2>
        {Object.entries(formulas).map(([n, f]) => <div key={n}>{n}: <span className="ml-1">{f}</span></div>)}
        <div className="pt-1 text-grafite/75">Se a diferença do mês for negativa, a contribuição não cobre o gasto comercial informado, desde que nenhuma despesa tenha sido contada duas vezes. A comissão entra uma vez só: na margem (F) ou no gasto (G).</div>
        {config.usarFaixas && <div className="pt-1 text-grafite/75">Referência por etapa: {Object.values(config.faixas).map((f) => `${f.rotulo} ${f.min}% a ${f.max}%`).join("; ")}.</div>}
        <div className="pt-1 text-grafite/75">Compare cada conversão com o que você esperava (a sua resposta × 10 = %). A etapa em que o resultado ficou proporcionalmente mais abaixo da sua expectativa é a etapa prioritária para investigar. Isso não é referência de mercado nem prova da causa. Só compare se os dois números da etapa forem reais. Se forem estimados, a ação é começar a medir essa etapa. Etapa que não existe no seu negócio fica fora da comparação.</div>
      </section>

      <section className="space-y-1">
        <h2 className="border-b border-bronze/60 pb-0.5 text-base">Bloco 4: Ponte com a aula anterior</h2>
        <div><b>{config.ponte.rituais.pergunta}</b> {config.ponte.rituais.opcoes.map((o) => `[ ] ${o.rotulo}`).join("   ")}</div>
        <div><b>{config.ponte.clienteIdeal.pergunta}</b> ( ) Sim: ______________________________  ( ) Não</div>
        <div><b>{config.ponte.dependencia.pergunta}</b> {config.ponte.dependencia.opcoes.map((o) => `( ) ${o.rotulo}`).join("   ")}</div>
      </section>

      <section className="space-y-1">
        <h2 className="border-b border-bronze/60 pb-0.5 text-base">Síntese</h2>
        <div><b>{config.compromisso.titulo}</b></div>
        <div className="text-[11px] leading-4 text-grafite/75">{config.compromisso.instrucao}</div>
        {config.compromisso.campos.map((c) => (
          <div key={c.id}><b>{c.rotulo}:</b> {c.pergunta} <span className="inline-block w-72 border-b border-tinta align-bottom">&nbsp;</span></div>
        ))}
      </section>
    </main>
  );
}
