import { renderCrudPage } from "../crud.js";
import { fmtMoney, fmtDate } from "../utils.js";

const PAPEIS = [
  { value: "admin", label: "Administrador (acesso total)" },
  { value: "operador", label: "Operador (lançamentos)" },
];

export const config = {
  table: "funcionarios",
  title: "Funcionários",
  newLabel: "Novo funcionário",
  orderBy: { column: "nome" },
  searchable: ["nome", "cargo", "email"],
  wideForm: true,
  fields: [
    { key: "nome", label: "Nome completo", type: "text", required: true, colSpan: 2, showInList: true },
    { key: "email", label: "E-mail de acesso", type: "text", required: true, showInList: true, hint: "O funcionário deve usar este mesmo e-mail em \"Criar conta\" na tela de login para vincular o acesso." },
    { key: "papel", label: "Perfil de acesso", type: "select", required: true, options: PAPEIS, default: "operador", showInList: true, listFormat: (v) => v === "admin" ? '<span class="badge badge-ok">Administrador</span>' : '<span class="badge badge-mut">Operador</span>' },
    { key: "cargo", label: "Cargo", type: "text", showInList: true },
    { key: "telefone", label: "Telefone", type: "phone", placeholder: "(xx)xxxx-xxxx" },
    { key: "salario", label: "Salário (R$)", type: "number", step: "0.01", showInList: true, listFormat: (v) => fmtMoney(v) },
    { key: "valor_diaria", label: "Valor da diária (R$)", type: "number", step: "0.01" },
    { key: "data_admissao", label: "Data de admissão", type: "date", showInList: true },
    { key: "data_demissao", label: "Data de demissão", type: "date" },
    { key: "extras", label: "Extras (R$)", type: "number", step: "0.01" },
    { key: "descricao_extras", label: "Descrição dos extras", type: "text", colSpan: 2 },
    { key: "outros", label: "Outros benefícios / observações", type: "textarea", colSpan: 2, hideInList: true },
    { key: "ativo", label: "Funcionário ativo", type: "checkbox", default: true, checkboxLabel: "Ativo", showInList: true, listFormat: (v) => (v ? '<span class="badge badge-ok">Ativo</span>' : '<span class="badge badge-mut">Inativo</span>') },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
