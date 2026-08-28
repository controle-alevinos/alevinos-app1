import { renderCrudPage } from "../crud.js";
import { supabase } from "../supabaseClient.js";
import { fmtInt, fmtDate } from "../utils.js";

function tanqueLabel(r) {
  return `Tanque ${String(r.numero).padStart(2, "0")}${r.lote_atual ? " (lote: " + r.lote_atual + ")" : " (sem lote ativo)"}`;
}

async function mostrarEstoqueAtual() {
  const sel = document.getElementById("fld-tanque_id");
  if (!sel) return;
  const box = document.createElement("div");
  box.className = "suggestion-box";
  box.id = "estoque-info-box";
  box.textContent = "Selecione um tanque para ver o estoque atual.";
  sel.closest(".field").insertAdjacentElement("afterend", box);
  sel.addEventListener("change", async () => {
    if (!sel.value) { box.textContent = "Selecione um tanque para ver o estoque atual."; return; }
    box.textContent = "Consultando estoque...";
    const { data } = await supabase.from("v_tanque_status").select("*").eq("id", sel.value).maybeSingle();
    if (data && data.estoque_atual !== null) {
      box.innerHTML = `Estoque atual no tanque: <b>${fmtInt(data.estoque_atual)} peixes</b> (lote ${data.lote_id ? "ativo" : "—"}, ${fmtInt(data.dias_de_cultivo)} dias de cultivo).`;
    } else {
      box.textContent = "Este tanque não possui lote ativo (nenhum povoamento em aberto).";
    }
  });
}

export const config = {
  table: "mortalidades",
  title: "Lançamento de Mortalidade",
  newLabel: "Nova mortalidade",
  orderBy: { column: "data_referencia", ascending: false },
  searchable: ["observacao"],
  selectExpr: "*, tanques(numero)",
  fields: [
    { key: "data_referencia", label: "Data de referência", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "tanque_id", label: "Tanque", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.tanques?.numero ? "Tanque " + String(row.tanques.numero).padStart(2, "0") : "—" },
    { key: "quantidade", label: "Quantidade de peixes", type: "number", required: true, showInList: true, listFormat: (v) => fmtInt(v) },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
  onFormMount: mostrarEstoqueAtual,
};

export function render(container) {
  renderCrudPage(container, config);
}
