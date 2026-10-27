import PainelView from "../../components/PainelView";
import { config } from "../../diagnostico.config";

export default async function Page({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { turma } = await searchParams;
  return <PainelView turma={turma || config.turmaPadrao} />;
}
