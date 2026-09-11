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
