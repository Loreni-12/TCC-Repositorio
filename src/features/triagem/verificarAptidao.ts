import { CRITERIOS, PARAMETROS, VERSAO_CRITERIOS, type CodigoCriterio } from "../../config/criterios";
import type { Episodio, RespostasTriagem, ResultadoAptidao, ResultadoTriagem } from "../../types/triagem";
import { idadeEmAnos, inicioDoDia, somarDias, somarMeses } from "./datas";

interface Impedimento {
  codigo: CodigoCriterio;
  /** Data a partir da qual o impedimento deixa de valer; null = não dá para calcular. */
  liberaEm: Date | null;
}

/**
 * Operação verificarAptidao() da classe VerificacaoAptidao (monografia, Figura 4).
 * Versão real do Quadro 2: os limites vêm de src/config/criterios.ts, não de números fixos.
 * Resultado orientativo, não substitui a triagem do hemocentro.
 */
export function verificarAptidao(respostas: RespostasTriagem, agora: Date = new Date()): ResultadoTriagem {
  const hoje = inicioDoDia(agora);
  const impedimentos: Impedimento[] = [];
  const orientacoes: CodigoCriterio[] = [];

  const temporario = (codigo: CodigoCriterio, liberaEm: Date | null = null) => {
    if (liberaEm === null || liberaEm > hoje) impedimentos.push({ codigo, liberaEm });
  };
  const definitivo = (codigo: CodigoCriterio) => impedimentos.push({ codigo, liberaEm: null });
  /** Sintoma/tratamento atual: temporário sem data. Já terminou: temporário até a data calculada. */
  const episodio = (e: Episodio, codigo: CodigoCriterio, liberaEm: (fim: Date) => Date) => {
    if (e.situacao === "atual") temporario(codigo);
    if (e.situacao === "terminou") temporario(codigo, liberaEm(e.fim));
  };

  // Idade
  const idade = idadeEmAnos(respostas.dataNascimento, hoje);
  if (idade < PARAMETROS.idadeMinima) {
    temporario("IDADE_MINIMA", somarMeses(respostas.dataNascimento, PARAMETROS.idadeMinima * 12));
  } else if (idade > PARAMETROS.idadeMaxima) {
    definitivo("IDADE_MAXIMA");
  } else if (idade > PARAMETROS.idadeMaximaPrimeiraDoacao && respostas.ultimaDoacao === null) {
    definitivo("PRIMEIRA_DOACAO_APOS_60");
  }
  if (idade >= PARAMETROS.idadeMinima && idade < PARAMETROS.idadeMaioridade) orientacoes.push("MENOR_DE_18");

  // Peso e documento
  if (respostas.pesoKg < PARAMETROS.pesoMinimoKg) temporario("PESO_MINIMO");
  if (!respostas.temDocumentoComFoto) temporario("DOCUMENTO_COM_FOTO");

  // Condições no dia da doação
  if (!respostas.sentindoBem) temporario("BEM_ESTAR");
  if (respostas.horasDeSono < PARAMETROS.horasSonoMinimas) temporario("SONO");
  if (respostas.bebeuAlcool12Horas) temporario("ALCOOL");
  if (!respostas.alimentadoEHidratado) orientacoes.push("HIDRATACAO");

  // Doações anteriores
  if (respostas.ultimaDoacao) {
    const { data, doacoesUltimos12Meses } = respostas.ultimaDoacao;
    temporario("INTERVALO_ENTRE_DOACOES", somarMeses(data, PARAMETROS.mesesEntreDoacoes[respostas.sexo]));
    if (doacoesUltimos12Meses >= PARAMETROS.doacoesPorAno[respostas.sexo]) temporario("LIMITE_ANUAL_DOACOES");
  }

  // Sintomas e doenças recentes. Gripe: FAQ (7 dias) ou, com febre ≥ 38 °C, Portaria (2 semanas).
  const codigoGripe = respostas.gripeComFebre ? "GRIPE_COM_FEBRE" : "GRIPE_RESFRIADO";
  const diasGripe = respostas.gripeComFebre ? PARAMETROS.diasAposGripeComFebre : PARAMETROS.diasAposGripe;
  episodio(respostas.gripe, codigoGripe, (fim) => somarDias(fim, diasGripe));
  episodio(respostas.diarreia, "DIARREIA", (fim) => somarDias(fim, PARAMETROS.diasAposDiarreia));
  episodio(respostas.infeccaoTratada, "INFECCAO_BACTERIANA", (fim) => somarDias(fim, PARAMETROS.diasAposTratamentoInfeccao));
  episodio(respostas.sifilis, "SIFILIS", (fim) => somarMeses(fim, PARAMETROS.mesesAposTratamentoSifilis));
  if (respostas.epilepsiaRecente) temporario("EPILEPSIA");
  if (respostas.dengue.tipo === "dengue") temporario("DENGUE", somarDias(respostas.dengue.cura, PARAMETROS.diasAposDengue));
  if (respostas.dengue.tipo === "grave") {
    temporario("DENGUE_GRAVE", somarMeses(respostas.dengue.cura, PARAMETROS.mesesAposDengueGrave));
  }
  if (respostas.dataTatuagem) {
    temporario("TATUAGEM", somarMeses(respostas.dataTatuagem, PARAMETROS.mesesAposTatuagem));
  }
  if (respostas.dataCuraMalaria) {
    temporario("MALARIA", somarMeses(respostas.dataCuraMalaria, PARAMETROS.mesesAposCuraMalaria));
  }
  if (respostas.gravida) temporario("GRAVIDEZ");
  if (respostas.amamentando) {
    temporario("AMAMENTACAO", somarMeses(respostas.amamentando.dataNascimentoBebe, PARAMETROS.mesesAmamentacao));
  }

  // Definitivos
  if (respostas.hepatiteApos11Anos) definitivo("HEPATITE_APOS_11_ANOS");
  if (respostas.infeccoesDefinitivas) definitivo("INFECCOES_DEFINITIVAS");
  if (respostas.doencaGrave) definitivo("DOENCA_GRAVE");
  if (respostas.cancer) definitivo("CANCER");

  orientacoes.push("ALIMENTACAO");

  const resultado = classificar(impedimentos);
  return {
    resultado,
    motivos: impedimentos.map((i) => i.codigo),
    orientacoes,
    reavaliarAPartirDe: resultado === "inapto_temporario" ? dataDeReavaliacao(impedimentos) : null,
    versaoCriterios: VERSAO_CRITERIOS,
    dataResposta: agora,
  };
}

function classificar(impedimentos: Impedimento[]): ResultadoAptidao {
  if (impedimentos.some((i) => CRITERIOS[i.codigo].tipo === "definitivo")) return "inapto";
  if (impedimentos.length > 0) return "inapto_temporario";
  return "apto";
}

/** A maior data entre os impedimentos; null se algum deles não tiver data calculável. */
function dataDeReavaliacao(impedimentos: Impedimento[]): Date | null {
  let maior: Date | null = null;
  for (const { liberaEm } of impedimentos) {
    if (liberaEm === null) return null;
    if (maior === null || liberaEm > maior) maior = liberaEm;
  }
  return maior;
}
