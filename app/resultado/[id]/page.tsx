import ResultadoView from "../../../components/ResultadoView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultadoView id={id} />;
}
