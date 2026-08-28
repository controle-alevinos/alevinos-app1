import { renderCrudPage } from "../crud.js";
import { enderecoFields, badgeAtivo } from "./shared.js";

export const config = {
  table: "fornecedores",
  title: "Cadastro de Fornecedor",
  newLabel: "Novo fornecedor",
  orderBy: { column: "nome_empresa" },
  searchable: ["nome_empresa", "cnpj_cpf", "cidade"],
  fields: [
    ...enderecoFields({ nomeKey: "nome_empresa", nomeLabel: "Nome da empresa" }),
    { key: "ativo", label: "Fornecedor ativo", type: "checkbox", default: true, listFormat: badgeAtivo, checkboxLabel: "Ativo" },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
