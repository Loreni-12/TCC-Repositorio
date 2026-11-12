import type { CodigoCriterio } from "../config/criterios";

export type Sexo = "feminino" | "masculino";
export type ResultadoAptidao = "apto" | "inapto_temporario" | "inapto";

/** Situação recente com data de término (sintomas que passaram, tratamento concluído). */
export type Episodio = { situacao: "nao" } | { situacao: "atual" } | { situacao: "terminou"; fim: Date };

/** Classe Resposta da monografia. Existe só na memória do navegador e nunca é salva (LGPD, decisão C2). */
export interface RespostasTriagem {
  // Identificação, idade e peso
  dataNascimento: Date;
  sexo: Sexo;
  pesoKg: number;
  ultimaDoacao: { data: Date; doacoesUltimos12Meses: number } | null;
  temDocumentoComFoto: boolean;
  // Condições no dia da doação
  sentindoBem: boolean;
  alimentadoEHidratado: boolean;
  horasDeSono: number;
  bebeuAlcool12Horas: boolean;
  // Doenças e sintomas recentes
  gripe: Episodio;
  gripeComFebre: boolean;
  diarreia: Episodio;
  infeccaoTratada: Episodio;
  hepatiteApos11Anos: boolean;
  infeccoesDefinitivas: boolean;
  sifilis: Episodio;
  dataCuraMalaria: Date | null;
  doencaGrave: boolean;
  epilepsiaRecente: boolean;
  cancer: boolean;
  dengue: { tipo: "nao" } | { tipo: "dengue" | "grave"; cura: Date };
  // Últimos 12 meses / gestação
  dataTatuagem: Date | null;
  gravida: boolean;
  amamentando: { dataNascimentoBebe: Date } | null;
}

/** Classes VerificacaoAptidao + ResultadoTriagem da monografia. É o que pode ser salvo. */
export interface ResultadoTriagem {
  resultado: ResultadoAptidao;
  motivos: CodigoCriterio[];
  orientacoes: CodigoCriterio[];
  reavaliarAPartirDe: Date | null;
  versaoCriterios: string;
  dataResposta: Date;
}
