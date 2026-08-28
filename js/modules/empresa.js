import { renderCrudPage } from "../crud.js";
import { enderecoFields } from "./shared.js";

export const config = {
  table: "empresa",
  title: "Cadastro da Empresa",
  newLabel: "Nova empresa",
  orderBy: { column: "nome_empresa" },
  searchable: ["nome_empresa", "cnpj_cpf", "cidade"],
  fields: enderecoFields({ nomeKey: "nome_empresa", nomeLabel: "Nome da empresa" }),
};

export function render(container) {
  renderCrudPage(container, config);
}
