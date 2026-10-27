import Formulario from "../components/Formulario";
import { config } from "../diagnostico.config";

export default async function Home({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { turma } = await searchParams;
  return <Formulario turma={turma || config.turmaPadrao} />;
}
