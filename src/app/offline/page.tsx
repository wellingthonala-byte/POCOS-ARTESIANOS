export default function PaginaOffline() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Sem conexão</h1>
      <p className="text-gray-600">
        Esta página ainda não tinha sido carregada antes, então não está
        disponível sem internet. Assim que a conexão voltar, tente de novo.
      </p>
    </main>
  );
}
