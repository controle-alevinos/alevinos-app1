import { renderCrudPage } from "../crud.js";
import { fmtMoney } from "../utils.js";

const TIPOS = [
  { value: "manutenção", label: "Manutenção" },
  { value: "custo fixo", label: "Custo fixo" },
];

export const config = {
  table: "custos_fixos",
  title: "Manutenção e Custos Fixos",
  newLabel: "Novo lançamento",
  orderBy: { column: "data", ascending: false },
  searchable: ["descricao", "categoria"],
  selectExpr: "*, tanques(numero), fornecedores(nome_empresa)",
  wideForm: true,
  fields: [
    { key: "data", label: "Data", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "tipo", label: "Tipo", type: "select", required: true, options: TIPOS, showInList: true },
    { key: "categoria", label: "Categoria", type: "text", placeholder: "Energia, água, mão de obra, equipamento...", showInList: true },
    { key: "descricao", label: "Descrição", type: "text", required: true, colSpan: 2, showInList: true },
    { key: "valor", label: "Valor (R$)", type: "number", step: "0.01", required: true, showInList: true, listFormat: (v) => fmtMoney(v) },
    { key: "recorrente", label: "Recorrente", type: "checkbox", checkboxLabel: "É um custo recorrente (mensal)", showInList: true, listFormat: (v) => (v ? '<span class="badge badge-warn">Recorrente</span>' : '<span class="badge badge-mut">Pontual</span>') },
    { key: "tanque_id", label: "Tanque (opcional)", type: "fk", fkTable: "tanques", fkLabel: "numero", listFormat: (v, row) => row.tanques?.numero ? "Tanque " + row.tanques.numero : "—" },
    { key: "fornecedor_id", label: "Fornecedor (opcional)", type: "fk", fkTable: "fornecedores", fkLabel: "nome_empresa" },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
