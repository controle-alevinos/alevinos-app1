import { renderCrudPage } from "../crud.js";
import { fmtInt, fmtNumber } from "../utils.js";

function tanqueLabel(r) {
  return `Tanque ${String(r.numero).padStart(2, "0")}${r.lote_atual ? " (lote: " + r.lote_atual + ")" : " (sem lote ativo)"}`;
}

export const config = {
  table: "transferencias",
  title: "Transferência entre Tanques",
  newLabel: "Nova transferência",
  orderBy: { column: "data_transferencia", ascending: false },
  searchable: ["observacao"],
  selectExpr: "*, origem:tanque_origem_id(numero), destino:tanque_destino_id(numero)",
  wideForm: true,
  fields: [
    { key: "data_transferencia", label: "Data da transferência", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "tanque_origem_id", label: "Tanque de origem", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.origem?.numero ? "Tanque " + String(row.origem.numero).padStart(2, "0") : "—" },
    { key: "biometria_origem_g", label: "Biometria origem (g)", type: "number", step: "0.01", showInList: true, listFormat: (v) => fmtNumber(v) },
    { key: "quantidade_origem", label: "Quantidade origem", type: "number", required: true, showInList: true, listFormat: (v) => fmtInt(v) },
    { key: "tanque_destino_id", label: "Tanque de destino", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.destino?.numero ? "Tanque " + String(row.destino.numero).padStart(2, "0") : "—" },
    { key: "biometria_destino_g", label: "Biometria destino (g)", type: "number", step: "0.01", showInList: true, listFormat: (v) => fmtNumber(v) },
    { key: "quantidade_destino", label: "Quantidade destino", type: "number", required: true, showInList: true, listFormat: (v) => fmtInt(v) },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
  beforeSave: (payload) => {
    if (payload.tanque_origem_id && payload.tanque_origem_id === payload.tanque_destino_id) {
      throw new Error("O tanque de destino deve ser diferente do tanque de origem.");
    }
    return payload;
  },
};

export function render(container) {
  renderCrudPage(container, config);
}
