// Fontes oficiais usadas no site. Toda informação de saúde exibida deve apontar para uma delas.
// `acessoEm`: data em que a equipe/assistente abriu a página e conferiu o conteúdo.
export interface Fonte {
  titulo: string;
  orgao: string;
  url: string;
  atualizadaEm?: string;
  acessoEm: string;
}

export const FONTES = {
  faqMinisterioSaude: {
    titulo: "Perguntas frequentes sobre doação de sangue",
    orgao: "Ministério da Saúde",
    url: "https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/faq",
    atualizadaEm: "2023-06-14",
    acessoEm: "2026-10-12",
  },
  portaria158: {
    titulo:
      "Portaria GM/MS nº 158/2016, regulamento técnico de procedimentos hemoterápicos (consolidada na Portaria de Consolidação nº 5/2017, Anexo IV)",
    orgao: "Ministério da Saúde",
    url: "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2016/prt0158_04_02_2016.html",
    atualizadaEm: "2016-02-04",
    acessoEm: "2026-11-12",
  },
  hemoscRequisitos: {
    titulo: "Requisitos para doar",
    orgao: "HEMOSC",
    url: "https://www.hemosc.org.br/como-doar.html",
    acessoEm: "2026-10-12",
  },
} as const satisfies Record<string, Fonte>;

export type ChaveFonte = keyof typeof FONTES;
