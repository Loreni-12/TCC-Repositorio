import type { Episodio, RespostasTriagem } from "../../types/triagem";
import { idadeEmAnos, inicioDoDia, lerDataIso, somarMeses } from "./datas";

type SimNao = "" | "sim" | "nao";
/** "atual" = ainda com sintomas / em tratamento; "terminou" = já passou (pede a data). */
type Situacao = "" | "nao" | "atual" | "terminou";

/** Valores crus dos campos do formulário (strings, como vêm dos inputs). */
export interface FormularioTriagem {
  // 1. Identificação, idade e peso
  dataNascimento: string;
  sexo: "" | "feminino" | "masculino";
  peso: string;
  jaDoou: SimNao;
  dataUltimaDoacao: string;
  doacoesUltimos12Meses: string;
  documentoComFoto: SimNao;
  // 2. Condições no dia da doação
  sentindoBem: SimNao;
  alimentado: SimNao;
  horasSono: string;
  alcool12Horas: SimNao;
  // 3. Doenças e sintomas recentes
  gripe: Situacao;
  gripeFebre: SimNao;
  dataFimGripe: string;
  diarreia: Situacao;
  dataFimDiarreia: string;
  infeccaoTratada: Situacao;
  dataFimInfeccao: string;
  hepatiteApos11Anos: SimNao;
  infeccoesDefinitivas: SimNao;
  sifilis: Situacao;
  dataFimSifilis: string;
  malaria12Meses: SimNao;
  dataCuraMalaria: string;
  doencaGrave: SimNao;
  epilepsia: SimNao;
  cancer: "" | "nao" | "sim" | "excecao";
  dengue: "" | "nao" | "dengue" | "grave";
  dataCuraDengue: string;
  // 4. Últimos 12 meses e gestação
  tatuagem12Meses: SimNao;
  dataTatuagem: string;
  gravida: SimNao;
  amamentando: SimNao;
  dataNascimentoBebe: string;
}

export const FORMULARIO_VAZIO: FormularioTriagem = {
  dataNascimento: "",
  sexo: "",
  peso: "",
  jaDoou: "",
  dataUltimaDoacao: "",
  doacoesUltimos12Meses: "",
  documentoComFoto: "",
  sentindoBem: "",
  alimentado: "",
  horasSono: "",
  alcool12Horas: "",
  gripe: "",
  gripeFebre: "",
  dataFimGripe: "",
  diarreia: "",
  dataFimDiarreia: "",
  infeccaoTratada: "",
  dataFimInfeccao: "",
  hepatiteApos11Anos: "",
  infeccoesDefinitivas: "",
  sifilis: "",
  dataFimSifilis: "",
  malaria12Meses: "",
  dataCuraMalaria: "",
  doencaGrave: "",
  epilepsia: "",
  cancer: "",
  dengue: "",
  dataCuraDengue: "",
  tatuagem12Meses: "",
  dataTatuagem: "",
  gravida: "",
  amamentando: "",
  dataNascimentoBebe: "",
};

export type ErrosFormulario = Partial<Record<keyof FormularioTriagem, string>>;

export type ValidacaoFormulario =
  | { valido: true; respostas: RespostasTriagem }
  | { valido: false; erros: ErrosFormulario };

const OBRIGATORIO = "Responda esta pergunta.";
type Campo = keyof FormularioTriagem;

/** Converte e valida o formulário. Perguntas condicionais só são exigidas quando aparecem. */
export function validarFormulario(f: FormularioTriagem, agora: Date = new Date()): ValidacaoFormulario {
  const hoje = inicioDoDia(agora);
  const erros: ErrosFormulario = {};
  const umAnoAtras = somarMeses(hoje, -12);
  const seisMesesAtras = somarMeses(hoje, -6);

  const dataPassada = (campo: Campo, valor: string, desde?: { data: Date; periodo: string }): Date | null => {
    const data = lerDataIso(valor);
    if (!valor) erros[campo] = "Informe a data.";
    else if (!data) erros[campo] = "Data inválida.";
    else if (data > hoje) erros[campo] = "A data não pode estar no futuro.";
    else if (desde && data < desde.data) erros[campo] = `A data deve estar dentro dos ${desde.periodo}.`;
    else return data;
    return null;
  };
  const exigir = (campo: Campo) => {
    if (f[campo] === "") erros[campo] = OBRIGATORIO;
  };
  const simNao = (campo: Campo): boolean => {
    exigir(campo);
    return f[campo] === "sim";
  };
  const episodio = (campo: Campo, campoData: Campo, desde?: { data: Date; periodo: string }): Episodio => {
    exigir(campo);
    if (f[campo] === "atual") return { situacao: "atual" };
    if (f[campo] === "terminou") {
      const fim = dataPassada(campoData, f[campoData], desde);
      if (fim) return { situacao: "terminou", fim };
    }
    return { situacao: "nao" };
  };

  // 1. Identificação, idade e peso
  const dataNascimento = dataPassada("dataNascimento", f.dataNascimento);
  if (dataNascimento && idadeEmAnos(dataNascimento, hoje) > 120) erros.dataNascimento = "Confira o ano de nascimento.";

  exigir("sexo");

  const peso = Number(f.peso.replace(",", "."));
  if (!f.peso) erros.peso = "Informe seu peso.";
  else if (!Number.isFinite(peso) || peso <= 0 || peso > 400) erros.peso = "Informe o peso em quilos (ex.: 62,5).";

  exigir("jaDoou");
  let ultimaDoacao: RespostasTriagem["ultimaDoacao"] = null;
  if (f.jaDoou === "sim") {
    const data = dataPassada("dataUltimaDoacao", f.dataUltimaDoacao);
    const quantidade = Number(f.doacoesUltimos12Meses);
    if (f.doacoesUltimos12Meses === "" || !Number.isInteger(quantidade) || quantidade < 0 || quantidade > 12) {
      erros.doacoesUltimos12Meses = "Informe um número inteiro entre 0 e 12.";
    } else if (data) {
      ultimaDoacao = { data, doacoesUltimos12Meses: quantidade };
    }
  }

  const temDocumentoComFoto = simNao("documentoComFoto");

  // 2. Condições no dia da doação
  const sentindoBem = simNao("sentindoBem");
  const alimentadoEHidratado = simNao("alimentado");
  const horasDeSono = Number(f.horasSono.replace(",", "."));
  if (!f.horasSono) erros.horasSono = "Informe quantas horas você dormiu.";
  else if (!Number.isFinite(horasDeSono) || horasDeSono < 0 || horasDeSono > 24) erros.horasSono = "Informe um número entre 0 e 24.";
  const bebeuAlcool12Horas = simNao("alcool12Horas");

  // 3. Doenças e sintomas recentes
  const gripe = episodio("gripe", "dataFimGripe");
  const gripeComFebre = f.gripe === "atual" || f.gripe === "terminou" ? simNao("gripeFebre") : false;
  const diarreia = episodio("diarreia", "dataFimDiarreia");
  const infeccaoTratada = episodio("infeccaoTratada", "dataFimInfeccao");
  const hepatiteApos11Anos = simNao("hepatiteApos11Anos");
  const infeccoesDefinitivas = simNao("infeccoesDefinitivas");
  const sifilis = episodio("sifilis", "dataFimSifilis", { data: umAnoAtras, periodo: "últimos 12 meses" });

  exigir("malaria12Meses");
  const dataCuraMalaria =
    f.malaria12Meses === "sim"
      ? dataPassada("dataCuraMalaria", f.dataCuraMalaria, { data: umAnoAtras, periodo: "últimos 12 meses" })
      : null;

  const doencaGrave = simNao("doencaGrave");
  const epilepsiaRecente = simNao("epilepsia");
  exigir("cancer");

  exigir("dengue");
  let dengue: RespostasTriagem["dengue"] = { tipo: "nao" };
  if (f.dengue === "dengue" || f.dengue === "grave") {
    const cura = dataPassada("dataCuraDengue", f.dataCuraDengue, { data: seisMesesAtras, periodo: "últimos 6 meses" });
    if (cura) dengue = { tipo: f.dengue, cura };
  }

  // 4. Últimos 12 meses e gestação
  exigir("tatuagem12Meses");
  const dataTatuagem =
    f.tatuagem12Meses === "sim"
      ? dataPassada("dataTatuagem", f.dataTatuagem, { data: umAnoAtras, periodo: "últimos 12 meses" })
      : null;

  let amamentando: RespostasTriagem["amamentando"] = null;
  if (f.sexo === "feminino") {
    exigir("gravida");
    exigir("amamentando");
    if (f.amamentando === "sim") {
      const dataNascimentoBebe = dataPassada("dataNascimentoBebe", f.dataNascimentoBebe);
      if (dataNascimentoBebe) amamentando = { dataNascimentoBebe };
    }
  }

  if (Object.keys(erros).length > 0 || !dataNascimento || f.sexo === "") return { valido: false, erros };

  return {
    valido: true,
    respostas: {
      dataNascimento,
      sexo: f.sexo,
      pesoKg: peso,
      ultimaDoacao,
      temDocumentoComFoto,
      sentindoBem,
      alimentadoEHidratado,
      horasDeSono,
      bebeuAlcool12Horas,
      gripe,
      gripeComFebre,
      diarreia,
      infeccaoTratada,
      hepatiteApos11Anos,
      infeccoesDefinitivas,
      sifilis,
      dataCuraMalaria,
      doencaGrave,
      epilepsiaRecente,
      cancer: f.cancer === "sim",
      dengue,
      dataTatuagem,
      gravida: f.sexo === "feminino" && f.gravida === "sim",
      amamentando,
    },
  };
}
