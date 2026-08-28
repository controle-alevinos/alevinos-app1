import { renderCrudPage } from "../crud.js";
import { supabase } from "../supabaseClient.js";
import { fmtInt, fmtNumber, fmtMoney } from "../utils.js";

function tanqueLabel(r) {
  return `Tanque ${String(r.numero).padStart(2, "0")}${r.lote_atual ? " (lote: " + r.lote_atual + ")" : " (sem lote ativo)"}`;
}

const MEDIDAS = [
  { value: "kg", label: "Kg (peso)" },
  { value: "copo", label: "Copo(s)" },
  { value: "balde", label: "Balde(s)" },
];

async function ligarSugestaoDeTratamento() {
  const selTanque = document.getElementById("fld-tanque_id");
  const selRacao = document.getElementById("fld-racao_id");
  const inputQtd = document.getElementById("fld-quantidade_kg");
  if (!selTanque) return;
  const box = document.createElement("div");
  box.className = "suggestion-box";
  box.id = "sugestao-trato-box";
  box.textContent = "Selecione um tanque para ver a sugestão de trato baseada na tabela de nutrição.";
  selTanque.closest(".field").insertAdjacentElement("afterend", box);

  selTanque.addEventListener("change", async () => {
    if (!selTanque.value) return;
    box.textContent = "Calculando sugestão...";
    const { data } = await supabase.from("v_sugestao_trato").select("*").eq("tanque_id", selTanque.value).maybeSingle();
    if (data) {
      box.innerHTML = `📋 <b>Sugestão (${data.fase || "—"})</b> — estoque ${fmtInt(data.estoque_atual)} peixes,
        peso médio est. ${fmtNumber(data.peso_estimado_atual_g)}g, biomassa ${fmtNumber(data.biomassa_atual_kg)}kg.<br/>
        Taxa recomendada: <b>${data.taxa_alimentacao_pct ?? "—"}% PV/dia</b> ·
        Ração sugerida no dia: <b>${fmtNumber(data.racao_sugerida_dia_kg)} kg</b> ·
        Frequência: <b>${data.frequencia_dia ?? "—"}x/dia</b> · Pellet: <b>${data.pellet_mm ?? "—"}</b><br/>
        Produto de referência: <b>${data.produto_referencia ?? "—"}</b> (CA esperada ${data.ca_esperada ?? "—"})`;
      if (inputQtd && !inputQtd.value && data.racao_sugerida_dia_kg) {
        inputQtd.value = data.racao_sugerida_dia_kg;
      }
    } else {
      box.textContent = "Este tanque não possui lote ativo — não é possível sugerir trato.";
    }
  });
}

export const config = {
  table: "alimentacao",
  title: "Alimentação (Trato)",
  newLabel: "Novo lançamento",
  orderBy: { column: "data_trato", ascending: false },
  searchable: ["observacao"],
  selectExpr: "*, tanques(numero), racoes(nome_racao)",
  wideForm: true,
  fields: [
    { key: "data_trato", label: "Data do trato", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "hora_trato", label: "Hora do trato", type: "time", required: true, default: new Date().toTimeString().slice(0, 5), showInList: true },
    { key: "tanque_id", label: "Tanque", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.tanques?.numero ? "Tanque " + String(row.tanques.numero).padStart(2, "0") : "—" },
    { key: "racao_id", label: "Ração utilizada", type: "fk", required: true, fkTable: "racoes", fkLabel: "nome_racao", showInList: true, listFormat: (v, row) => row.racoes?.nome_racao || "—" },
    { key: "quantidade_kg", label: "Quantidade (kg)", type: "number", step: "0.01", required: true, showInList: true, listFormat: (v) => fmtNumber(v) },
    { key: "quantidade_medida_tipo", label: "Medida utilizada", type: "select", options: MEDIDAS, default: "kg" },
    { key: "quantidade_medida_valor", label: "Quantidade medida (nº de copos/baldes)", type: "number", step: "0.1", hint: "Preencha se o trato foi medido em copo/balde ao invés de balança." },
    { key: "custo_estimado", label: "Custo estimado (R$)", type: "number", showInList: true, hideInForm: true, computed: true, listFormat: (v) => fmtMoney(v) },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
  onFormMount: ligarSugestaoDeTratamento,
};

export function render(container) {
  renderCrudPage(container, config);
}
