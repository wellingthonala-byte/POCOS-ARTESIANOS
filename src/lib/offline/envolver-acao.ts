import { enfileirar, enfileirarOuSubstituir, formDataParaObjeto } from "./fila-sincronizacao";

// Wrapper genérico reaproveitado por qualquer tela que chame uma server
// action diretamente (via useActionState ou dentro de um startTransition):
// se a chamada falhar por falta de rede, guarda a tentativa na fila de
// sincronização (Fase 5, etapa 3) em vez de deixar o erro estourar sem
// tratamento.
export function ehErroDeRede(erro: unknown): boolean {
  // Servidor inalcançável (offline, ou caiu no meio da requisição) sempre
  // chega aqui como TypeError — é o erro padrão da Fetch API pra "não deu
  // nem pra tentar a requisição". Um erro de validação da própria action
  // nunca lança — ela sempre devolve `{ erro: "..." }` normalmente, então
  // não é confundido com isso aqui.
  return erro instanceof TypeError;
}

type EstadoComPendente = { erro?: string; sucesso?: boolean; pendente?: boolean };

export function envolverAcaoComFilaOffline<E extends EstadoComPendente>(
  acao: (estado: E, formData: FormData) => Promise<E>,
  tipo: string,
  pocoId: string,
  opcoes?: { substituirNaFila?: boolean }
): (estado: E, formData: FormData) => Promise<E> {
  return async (estadoAnterior, formData) => {
    try {
      return await acao(estadoAnterior, formData);
    } catch (erro) {
      if (!ehErroDeRede(erro)) throw erro;

      try {
        const item = { tipo, pocoId, payload: formDataParaObjeto(formData) };
        if (opcoes?.substituirNaFila) {
          await enfileirarOuSubstituir(item);
        } else {
          await enfileirar(item);
        }
      } catch {
        return {
          ...estadoAnterior,
          erro: "Sem conexão e não foi possível guardar a alteração neste aparelho para sincronizar depois.",
          sucesso: false,
        };
      }
      return { ...estadoAnterior, sucesso: true, pendente: true };
    }
  };
}

type EstadoComErro = { erro?: string; sucesso?: boolean };

/**
 * Para telas sem fila de sincronização ainda (ex.: análise físico-química
 * — ver `pocos/acoes.ts`): não guarda a tentativa pra sincronizar depois,
 * só evita que uma falha de rede quebre a tela com "Application error".
 * Se um dia essa tela precisar de suporte offline de verdade, troque por
 * `envolverAcaoComFilaOffline`.
 */
export function envolverAcaoSemFila<E extends EstadoComErro>(
  acao: (estado: E, formData: FormData) => Promise<E>
): (estado: E, formData: FormData) => Promise<E> {
  return async (estadoAnterior, formData) => {
    try {
      return await acao(estadoAnterior, formData);
    } catch (erro) {
      if (!ehErroDeRede(erro)) throw erro;
      return {
        ...estadoAnterior,
        erro: "Sem conexão. Esta tela ainda não guarda alterações offline — tente novamente quando a internet voltar.",
        sucesso: false,
      };
    }
  };
}
