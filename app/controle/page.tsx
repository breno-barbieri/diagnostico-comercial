import { config } from "../../diagnostico.config";
import PrintButton from "../../components/PrintButton";
import { Onda } from "../../components/Marca";

export default function Controle() {
  const c = config.controle;
  return (
    <main className="mx-auto max-w-[277mm] space-y-4 bg-papel p-6 text-[13px] print:p-0">
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      <div className="no-print flex justify-end"><PrintButton /></div>
      <div className="flex items-end gap-4"><Onda className="w-24 text-tinta" /><div><div className="rotulo">{config.evento}</div><h1 className="text-2xl">{c.titulo}</h1></div></div>
      <p>{c.instrucao}</p>
      <p>Responsável: ______________________________   Dia da semana: ____________________</p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {c.colunas.map((col) => (
              <th key={col} className="border border-tinta p-2 text-left align-bottom font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: c.semanas }, (_, i) => (
            <tr key={i}>
              {c.colunas.map((col, j) => (
                <td key={col} className="h-10 border border-tinta p-2">{j === 0 ? `${i + 1}` : ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-grafite/75">Conversões para acompanhar: atendimentos ÷ contatos, orçamentos ÷ atendimentos, vendas ÷ orçamentos. Custo para conquistar um cliente: gasto ÷ vendas.</p>
    </main>
  );
}
