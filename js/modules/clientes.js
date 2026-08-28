import { renderCrudPage } from "../crud.js";
import { enderecoFields, badgeAtivo } from "./shared.js";

export const config = {
  table: "clientes",
  title: "Cadastro de Cliente",
  newLabel: "Novo cliente",
  orderBy: { column: "nome_cliente" },
  searchable: ["nome_cliente", "cnpj_cpf", "cidade"],
  fields: [
    ...enderecoFields({ nomeKey: "nome_cliente", nomeLabel: "Nome do cliente" }),
    { key: "ativo", label: "Cliente ativo", type: "checkbox", default: true, listFormat: badgeAtivo, checkboxLabel: "Ativo" },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
