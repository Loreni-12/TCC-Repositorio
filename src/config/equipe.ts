import fotoAna from "../assets/equipe/ana.jpg";
import fotoEduardo from "../assets/equipe/eduardo.jpg";
import fotoMilena from "../assets/equipe/milena.jpg";
import fotoThais from "../assets/equipe/thais.jpg";

// Dados da equipe extraídos do Termo de Abertura do Projeto (monografia, Anexo A, item 9).
// Fotos enviadas pela equipe, recortadas em 320 × 320 px.
export interface Integrante {
  nome: string;
  funcao: string;
  foto: string;
}

export const EQUIPE: Integrante[] = [
  { nome: "Ana Paula Pachuczki Ottequir", funcao: "Front-end", foto: fotoAna },
  { nome: "Eduardo Loreni Kfassniak", funcao: "Back-end", foto: fotoEduardo },
  { nome: "Milena Vitória Mognon", funcao: "Full-stack", foto: fotoMilena },
  { nome: "Thaís Fernanda Cruz", funcao: "Front-end", foto: fotoThais },
];

export const PROFESSORES = [
  { nome: "Luis Renato", papel: "Orientador" },
  { nome: "Oscar Stefen Junior", papel: "Projeto de Software" },
  { nome: "Emanuel Spanhol", papel: "Desenvolvimento de Sistemas Web 4" },
];

export const INSTITUICAO = {
  escola: "CEDUP Hermann Hering",
  curso: "Curso Técnico em Desenvolvimento de Sistemas",
  turma: "3º ano, turma 302",
  cidade: "Blumenau/SC",
  ano: 2026,
};

