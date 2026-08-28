import { renderCrudPage } from "../crud.js";
import { fmtInt, fmtNumber, fmtDate } from "../utils.js";

export const TIPOS_PEIXE = [
  { value: "tilápia", label: "Tilápia" },
  { value: "surubim", label: "Surubim" },
  { value: "tambaqui", label: "Tambaqui" },
  { value: "pacu", label: "Pacu" },
  { value: "pirarucu", label: "Pirarucu" },
  { value: "outro", label: "Outro" },
];
export const CONDICOES = [
  { value: "regular", label: "Regular" },
  { value: "bom", label: "Bom" },
  { value: "ótimo", label: "Ótimo" },
];

function tanqueLabel(r) {
  return `Tanque ${String(r.numero).padStart(2, "0")}${r.nome ? " — " + r.nome : ""}${r.lote_atual ? " (lote ativo: " + r.lote_atual + ")" : " (livre)"}`;
}

export const config = {
  table: "povoamento",
  title: "Povoamento de Peixes",
  newLabel: "Novo povoamento",
  orderBy: { column: "data_recebimento", ascending: false },
  searchable: ["tipo_peixe", "controle_fornecedor", "observacao"],
  selectExpr: "*, tanques(numero,nome), fornecedores(nome_empresa)",
  wideForm: true,
  fields: [
    { key: "data_recebimento", label: "Data do recebimento", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "tanque_id", label: "Tanque", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,nome,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.tanques?.numero ? "Tanque " + String(row.tanques.numero).padStart(2, "0") : "—" },
    { key: "tipo_peixe", label: "Tipo de peixe", type: "select", required: true, options: TIPOS_PEIXE, showInList: true },
    { key: "tamanho_peixe_g", label: "Tamanho do peixe recebido (g)", type: "number", step: "0.01", required: true, showInList: true, listFormat: (v) => fmtNumber(v) },
    { key: "quantidade", label: "Quantidade de peixes", type: "number", required: true, showInList: true, listFormat: (v) => fmtInt(v) },
    { key: "condicao", label: "Condição do peixe", type: "select", required: true, options: CONDICOES, default: "bom", showInList: true },
    { key: "fornecedor_id", label: "Fornecedor", type: "fk", fkTable: "fornecedores", fkLabel: "nome_empresa", showInList: true, listFormat: (v, row) => row.fornecedores?.nome_empresa || "—" },
    { key: "controle_fornecedor", label: "Controle do fornecedor (NF e/ou pedido)", type: "text", hideInList: true },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
