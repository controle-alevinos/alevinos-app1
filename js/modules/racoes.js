import { renderCrudPage } from "../crud.js";
import { fmtMoney, fmtNumber } from "../utils.js";
import { badgeAtivo } from "./shared.js";

export const config = {
  table: "racoes",
  title: "Cadastro de Ração",
  newLabel: "Nova ração",
  orderBy: { column: "nome_racao" },
  searchable: ["nome_racao"],
  fields: [
    { key: "nome_racao", label: "Nome da ração", type: "text", required: true, colSpan: 2, showInList: true },
    { key: "kg_por_saco", label: "Kg por saco", type: "number", step: "0.01", default: 25, showInList: true, listFormat: (v) => fmtNumber(v) },
    { key: "unidade_fornecimento_kg", label: "Unidade de fornecimento (kg)", type: "number", step: "0.01", hint: "Ex.: tamanho do lote mínimo comprado, em kg." },
    { key: "preco_unitario_kg", label: "Preço unitário (R$/kg)", type: "number", step: "0.0001", required: true, showInList: true, listFormat: (v) => fmtMoney(v) },
    { key: "preco_saco", label: "Preço do saco (R$)", type: "number", showInList: true, hideInForm: true, computed: true, listFormat: (v) => fmtMoney(v), hint: "Calculado automaticamente (preço/kg × kg por saco)." },
    { key: "fornecedor_id", label: "Fornecedor", type: "fk", fkTable: "fornecedores", fkLabel: "nome_empresa", showInList: true },
    { key: "ativo", label: "Ração ativa", type: "checkbox", default: true, checkboxLabel: "Ativa", listFormat: badgeAtivo, showInList: true },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
