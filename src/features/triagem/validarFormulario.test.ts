import { describe, expect, it } from "vitest";
import { FORMULARIO_VAZIO, validarFormulario, type FormularioTriagem } from "./validarFormulario";

const HOJE = new Date(2026, 9, 12);

const preenchido: FormularioTriagem = {
  ...FORMULARIO_VAZIO,
  dataNascimento: "1995-05-20",
  sexo: "masculino",
  peso: "72,5",
  jaDoou: "nao",
  documentoComFoto: "sim",
  sentindoBem: "sim",
  alimentado: "sim",
  horasSono: "7",
  alcool12Horas: "nao",
  gripe: "nao",
  diarreia: "nao",
  infeccaoTratada: "nao",
  hepatiteApos11Anos: "nao",
  infeccoesDefinitivas: "nao",
  sifilis: "nao",
  malaria12Meses: "nao",
  doencaGrave: "nao",
  epilepsia: "nao",
  cancer: "nao",
  dengue: "nao",
  tatuagem12Meses: "nao",
};

describe("validarFormulario", () => {
  it("formulário vazio aponta as perguntas obrigatórias", () => {
    const r = validarFormulario(FORMULARIO_VAZIO, HOJE);
    expect(r.valido).toBe(false);
    if (r.valido) return;
    expect(Object.keys(r.erros).sort()).toEqual(
      [
        "alcool12Horas", "alimentado", "cancer", "dataNascimento", "dengue", "diarreia", "documentoComFoto", "doencaGrave",
        "epilepsia", "gripe", "hepatiteApos11Anos", "horasSono", "infeccaoTratada", "infeccoesDefinitivas", "jaDoou",
        "malaria12Meses", "peso", "sentindoBem", "sexo", "sifilis", "tatuagem12Meses",
      ].sort(),
    );
  });

  it("converte um formulário válido (peso com vírgula)", () => {
    const r = validarFormulario(preenchido, HOJE);
    expect(r.valido).toBe(true);
    if (!r.valido) return;
    expect(r.respostas.pesoKg).toBe(72.5);
    expect(r.respostas.dataNascimento).toEqual(new Date(1995, 4, 20));
    expect(r.respostas.ultimaDoacao).toBeNull();
  });

  it("exige gravidez e amamentação apenas para o sexo feminino", () => {
    const r = validarFormulario({ ...preenchido, sexo: "feminino" }, HOJE);
    expect(r.valido).toBe(false);
    if (r.valido) return;
    expect(Object.keys(r.erros).sort()).toEqual(["amamentando", "gravida"]);
  });

  it("ignora respostas de gravidez se o sexo for masculino", () => {
    const r = validarFormulario({ ...preenchido, gravida: "sim" }, HOJE);
    expect(r.valido && r.respostas.gravida).toBe(false);
  });

  it("exige data e quantidade quando já doou", () => {
    const r = validarFormulario({ ...preenchido, jaDoou: "sim" }, HOJE);
    expect(r.valido).toBe(false);
    if (r.valido) return;
    expect(r.erros.dataUltimaDoacao).toBeDefined();
    expect(r.erros.doacoesUltimos12Meses).toBeDefined();
  });

  it("rejeita datas no futuro", () => {
    const r = validarFormulario({ ...preenchido, dataNascimento: "2030-01-01" }, HOJE);
    expect(!r.valido && r.erros.dataNascimento).toBe("A data não pode estar no futuro.");
  });

  it("rejeita tatuagem com data fora dos últimos 12 meses", () => {
    const r = validarFormulario({ ...preenchido, tatuagem12Meses: "sim", dataTatuagem: "2024-01-01" }, HOJE);
    expect(!r.valido && r.erros.dataTatuagem).toBe("A data deve estar dentro dos últimos 12 meses.");
  });

  it("rejeita peso inválido", () => {
    for (const peso of ["abc", "0", "-3", "500"]) {
      const r = validarFormulario({ ...preenchido, peso }, HOJE);
      expect(r.valido).toBe(false);
    }
  });

  it("pergunta da febre só é exigida quando houve gripe ou resfriado", () => {
    const r = validarFormulario({ ...preenchido, gripe: "atual" }, HOJE);
    expect(!r.valido && r.erros.gripeFebre).toBe("Responda esta pergunta.");
  });

  it("câncer do tipo exceção (basocelular / in situ de colo) não conta como câncer", () => {
    const r = validarFormulario({ ...preenchido, cancer: "excecao" }, HOJE);
    expect(r.valido && r.respostas.cancer).toBe(false);
  });

  it("dengue exige data de cura dentro dos últimos 6 meses", () => {
    const r = validarFormulario({ ...preenchido, dengue: "dengue", dataCuraDengue: "2025-01-01" }, HOJE);
    expect(!r.valido && r.erros.dataCuraDengue).toBe("A data deve estar dentro dos últimos 6 meses.");
  });

  it("horas de sono precisam ser um número entre 0 e 24", () => {
    for (const horasSono of ["abc", "-1", "30"]) expect(validarFormulario({ ...preenchido, horasSono }, HOJE).valido).toBe(false);
  });
});
