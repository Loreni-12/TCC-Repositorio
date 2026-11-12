import { CalendarDays, HeartPulse, Stethoscope, UserRound } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { formatarDataIso } from "../../features/triagem/datas";
import type { ErrosFormulario, FormularioTriagem } from "../../features/triagem/validarFormulario";
import { CampoOpcoes, type Opcao } from "../formulario/CampoOpcoes";
import { CampoTexto } from "../formulario/CampoTexto";
import { Botao } from "../ui/Botao";
import { Cartao } from "../ui/Cartao";

const SIM_NAO: readonly Opcao<"sim" | "nao">[] = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "nao", rotulo: "Não" },
];

type Campo = keyof FormularioTriagem;

interface Props {
  valores: FormularioTriagem;
  erros: ErrosFormulario;
  aoMudar: <K extends Campo>(campo: K, valor: FormularioTriagem[K]) => void;
  aoEnviar: () => void;
}

function Secao({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <Cartao>
      <h2 className="mb-6 flex items-center gap-3 text-xl">
        <span className="grid size-10 place-items-center rounded-full bg-rosa-claro text-vermelho">{icone}</span>
        {titulo}
      </h2>
      <div className="space-y-6">{children}</div>
    </Cartao>
  );
}

/** Questionário de pré-triagem (classe QuestionarioTriagem). Só UI: validação e regras ficam em features/triagem. */
export function FormularioTriagemCampos({ valores: v, erros, aoMudar, aoEnviar }: Props) {
  const hoje = formatarDataIso(new Date());
  const iconeClasse = "size-5";

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    aoEnviar();
  }

  /** Pergunta Sim/Não. */
  const simNao = (campo: Campo, pergunta: string, dica?: string) => (
    <CampoOpcoes
      pergunta={pergunta}
      nome={campo}
      dica={dica}
      opcoes={SIM_NAO}
      valor={v[campo] as "sim" | "nao" | ""}
      aoMudar={(x) => aoMudar(campo, x)}
      erro={erros[campo]}
    />
  );

  /** Campo de data (passado). */
  const data = (campo: Campo, rotulo: string, dica?: string) => (
    <CampoTexto rotulo={rotulo} dica={dica} type="date" max={hoje} value={v[campo]} aoMudar={(x) => aoMudar(campo, x)} erro={erros[campo]} />
  );

  /** Situação recente: não / atual / já terminou (+ data). */
  const situacao = (
    campo: "gripe" | "diarreia" | "infeccaoTratada" | "sifilis",
    campoData: Campo,
    pergunta: string,
    rotulos: { atual: string; terminou: string; nao?: string; data: string },
    dica?: string,
  ) => (
    <>
      <CampoOpcoes
        pergunta={pergunta}
        nome={campo}
        dica={dica}
        opcoes={[
          { valor: "nao", rotulo: rotulos.nao ?? "Não" },
          { valor: "atual", rotulo: rotulos.atual },
          { valor: "terminou", rotulo: rotulos.terminou },
        ]}
        valor={v[campo]}
        aoMudar={(x) => aoMudar(campo, x)}
        erro={erros[campo]}
      />
      {v[campo] === "terminou" && data(campoData, rotulos.data)}
    </>
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <Secao titulo="1. Identificação, idade e peso" icone={<UserRound aria-hidden className={iconeClasse} />}>
        {data("dataNascimento", "Qual é a sua data de nascimento?", "É preciso ter entre 16 e 69 anos. A primeira doação deve ser feita até os 60.")}
        <CampoOpcoes
          pergunta="Sexo"
          nome="sexo"
          dica="Os critérios oficiais de intervalo entre doações são diferentes para homens e mulheres."
          opcoes={[
            { valor: "feminino", rotulo: "Feminino" },
            { valor: "masculino", rotulo: "Masculino" },
          ]}
          valor={v.sexo}
          aoMudar={(x) => aoMudar("sexo", x)}
          erro={erros.sexo}
        />
        <CampoTexto
          rotulo="Qual é o seu peso atual (kg)?"
          dica="O mínimo é 50 kg."
          inputMode="decimal"
          autoComplete="off"
          placeholder="Ex.: 62,5"
          value={v.peso}
          aoMudar={(x) => aoMudar("peso", x)}
          erro={erros.peso}
        />
        {simNao("jaDoou", "Você já doou sangue anteriormente?")}
        {v.jaDoou === "sim" && (
          <>
            {data("dataUltimaDoacao", "Qual foi a data da última doação?", "Se não lembrar o dia exato, use uma data aproximada.")}
            <CampoTexto
              rotulo="Quantas vezes você doou nos últimos 12 meses?"
              type="number"
              inputMode="numeric"
              min={0}
              max={12}
              value={v.doacoesUltimos12Meses}
              aoMudar={(x) => aoMudar("doacoesUltimos12Meses", x)}
              erro={erros.doacoesUltimos12Meses}
            />
          </>
        )}
        {simNao(
          "documentoComFoto",
          "Você tem um documento oficial de identificação com foto para apresentar?",
          "Por exemplo: RG, CNH, carteira de trabalho, passaporte ou carteira profissional.",
        )}
      </Secao>

      <Secao titulo="2. Condições físicas no dia da doação" icone={<HeartPulse aria-hidden className={iconeClasse} />}>
        {simNao("sentindoBem", "Você se sente bem de saúde hoje?")}
        {simNao("alimentado", "Você está bem alimentado(a) e hidratado(a)?", "Evite jejum e alimentos gordurosos nas 3 horas antes da doação.")}
        <CampoTexto
          rotulo="Quantas horas você dormiu nas últimas 24 horas?"
          dica="O mínimo é 6 horas."
          type="number"
          inputMode="decimal"
          min={0}
          max={24}
          value={v.horasSono}
          aoMudar={(x) => aoMudar("horasSono", x)}
          erro={erros.horasSono}
        />
        {simNao("alcool12Horas", "Você ingeriu bebida alcoólica nas últimas 12 horas?")}
      </Secao>

      <Secao titulo="3. Histórico de doenças e sintomas recentes" icone={<Stethoscope aria-hidden className={iconeClasse} />}>
        {situacao("gripe", "dataFimGripe", "Você teve gripe ou resfriado nos últimos 15 dias?", {
          atual: "Estou com sintomas",
          terminou: "Tive, mas os sintomas já passaram",
          data: "Em que dia os sintomas terminaram?",
        })}
        {(v.gripe === "atual" || v.gripe === "terminou") && simNao("gripeFebre", "Você teve febre de 38 °C ou mais junto com a gripe ou o resfriado?")}
        {situacao("diarreia", "dataFimDiarreia", "Você teve diarreia nos últimos 15 dias?", {
          atual: "Estou com diarreia",
          terminou: "Tive, mas já passou",
          data: "Em que dia a diarreia passou?",
        })}
        {situacao(
          "infeccaoTratada",
          "dataFimInfeccao",
          "Nos últimos 15 dias, você tratou com antibiótico alguma infecção, como dor de garganta (amigdalite), sinusite, otite ou infecção urinária?",
          { atual: "Estou em tratamento", terminou: "Terminei o tratamento", data: "Em que dia o tratamento terminou?" },
        )}
        {simNao("hepatiteApos11Anos", "Você tem ou já teve hepatite após os 11 anos de idade?")}
        {simNao("infeccoesDefinitivas", "Você já teve diagnóstico de HIV/AIDS, HTLV, hepatite B, hepatite C ou doença de Chagas?")}
        {situacao("sifilis", "dataFimSifilis", "Você teve diagnóstico de sífilis?", {
          nao: "Não, ou terminei o tratamento há mais de 12 meses",
          atual: "Estou em tratamento",
          terminou: "Terminei o tratamento nos últimos 12 meses",
          data: "Em que dia o tratamento terminou?",
        })}
        {simNao("malaria12Meses", "Você se curou de malária nos últimos 12 meses?")}
        {v.malaria12Meses === "sim" && data("dataCuraMalaria", "Data da cura")}
        {simNao(
          "doencaGrave",
          "Você tem alguma destas doenças: doença cardíaca grave, doença pulmonar grave (como enfisema), doença renal crônica ou diabetes com uso de insulina?",
        )}
        {simNao(
          "epilepsia",
          "Você tem epilepsia em tratamento, ou suspendeu o tratamento ou teve crise convulsiva nos últimos 3 anos?",
        )}
        <CampoOpcoes
          pergunta="Você já teve diagnóstico de algum tipo de câncer (inclusive leucemia)?"
          nome="cancer"
          opcoes={[
            { valor: "nao", rotulo: "Não" },
            { valor: "sim", rotulo: "Sim" },
            { valor: "excecao", rotulo: "Só carcinoma basocelular de pele ou carcinoma in situ de colo do útero" },
          ]}
          valor={v.cancer}
          aoMudar={(x) => aoMudar("cancer", x)}
          erro={erros.cancer}
        />
        <CampoOpcoes
          pergunta="Você teve dengue nos últimos 6 meses?"
          nome="dengue"
          opcoes={[
            { valor: "nao", rotulo: "Não" },
            { valor: "dengue", rotulo: "Sim, dengue" },
            { valor: "grave", rotulo: "Sim, dengue hemorrágica (grave)" },
          ]}
          valor={v.dengue}
          aoMudar={(x) => aoMudar("dengue", x)}
          erro={erros.dengue}
        />
        {(v.dengue === "dengue" || v.dengue === "grave") && data("dataCuraDengue", "Em que dia você se curou?")}
      </Secao>

      <Secao titulo="4. Últimos 12 meses" icone={<CalendarDays aria-hidden className={iconeClasse} />}>
        {simNao("tatuagem12Meses", "Você fez tatuagem nos últimos 12 meses?")}
        {v.tatuagem12Meses === "sim" && data("dataTatuagem", "Data da tatuagem mais recente")}
        {v.sexo === "feminino" && (
          <>
            {simNao("gravida", "Você está grávida?")}
            {simNao("amamentando", "Você está amamentando?")}
            {v.amamentando === "sim" && data("dataNascimentoBebe", "Data de nascimento do bebê")}
          </>
        )}
      </Secao>

      {Object.keys(erros).length > 0 && (
        <p role="alert" className="font-semibold text-vermelho">
          Algumas respostas estão faltando ou precisam de correção. Confira os campos marcados.
        </p>
      )}

      <Botao type="submit" className="w-full sm:w-auto">
        Ver resultado
      </Botao>
    </form>
  );
}
