// Rótulos em português para os enums do domínio — usados tanto nas telas
// quanto nos relatórios (PDF/Excel), para manter a terminologia consistente
// em um único lugar.

export const rotulosStatusPoco: Record<string, string> = {
  planejado: "Planejado",
  em_perfuracao: "Em perfuração",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const coresStatusPoco: Record<string, string> = {
  planejado: "bg-gray-100 text-gray-700",
  em_perfuracao: "bg-amber-100 text-amber-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export const rotulosMetodoObtencaoCoordenada: Record<string, string> = {
  manual: "Digitado manualmente",
  gps_celular: "GPS do celular",
  gps_geodesico: "GPS geodésico",
};

export const rotulosMetodoPerfuracao: Record<string, string> = {
  rotativo: "Rotativo",
  rotopneumatico: "Rotopneumático",
  percussao: "Percussão",
  misto: "Misto",
};

export const rotulosTipoRevestimento: Record<string, string> = {
  liso: "Liso",
  filtro: "Filtro",
};

export const rotulosTipoPessoa: Record<string, string> = {
  fisica: "Pessoa física",
  juridica: "Pessoa jurídica",
};

export const rotulosMetodoDesenvolvimento: Record<string, string> = {
  pistoneamento: "Pistoneamento",
  ar_comprimido: "Ar comprimido",
  bombeamento: "Bombeamento",
  jateamento: "Jateamento",
  outro: "Outro",
};

export const rotulosTipoTesteVazao: Record<string, string> = {
  escalonado: "Escalonado",
  continuo: "Contínuo",
  recuperacao: "Recuperação",
};

export const rotulosTipoAnexo: Record<string, string> = {
  foto: "Foto",
  art: "ART",
  croqui: "Croqui",
  laudo: "Laudo",
  outro: "Outro",
};

// Tipo gravado em conflito_edicao — mesma chave usada na fila de
// sincronização offline (ver registro-acoes.ts).
export const rotulosTipoConflito: Record<string, string> = {
  "identificacao.atualizar": "Identificação e locação",
  "perfuracao.atualizar": "Perfuração",
  "niveisVazao.atualizar": "Níveis e vazão",
};

// Nome de campo (chave do payload) → rótulo em português, pra mostrar a
// comparação servidor×offline sem expor os nomes crus dos campos do banco.
export const rotulosCamposConflito: Record<string, string> = {
  identificacao: "Identificação",
  obraId: "Obra",
  status: "Status",
  municipio: "Município",
  uf: "UF",
  latitude: "Latitude",
  longitude: "Longitude",
  metodoObtencaoCoordenada: "Método de obtenção da coordenada",
  metodoPerfuracao: "Método de perfuração",
  dataInicioPerfuracao: "Início da perfuração",
  dataFimPerfuracao: "Fim da perfuração",
  profundidadeFinal: "Profundidade final",
  numeroArt: "Número da ART",
  responsavelTecnicoId: "Responsável técnico",
  nivelEstatico: "Nível estático",
  nivelDinamicoEstabilizado: "Nível dinâmico estabilizado",
  vazaoEstabilizada: "Vazão estabilizada",
};
