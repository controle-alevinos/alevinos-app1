import { UFS } from "../utils.js";

// Campos de endereço/contato/comercial reaproveitados nas Abas 1, 2 e 4
export function enderecoFields({ nomeKey, nomeLabel, incluirTelefone = true }) {
  const fields = [
    { key: nomeKey, label: nomeLabel, type: "text", required: true, colSpan: 2, showInList: true },
    { key: "cnpj_cpf", label: "CNPJ/CPF", type: "documento", placeholder: "000.000.000-00", showInList: true },
    { key: "ie", label: "IE (Inscrição Estadual)", type: "text", hideInList: true },
    { key: "rua", label: "Rua", type: "text", colSpan: 2, hideInList: true },
    { key: "bairro", label: "Bairro", type: "text", hideInList: true },
    { key: "cidade", label: "Cidade", type: "text", showInList: true },
    { key: "uf", label: "UF", type: "select", options: UFS.map((u) => ({ value: u, label: u })), showInList: true },
    { key: "cep", label: "CEP", type: "cep", placeholder: "00000-000", hideInList: true },
  ];
  if (incluirTelefone) {
    fields.push({ key: "telefone", label: "Telefone", type: "phone", placeholder: "(xx)xxxx-xxxx", showInList: true });
  }
  fields.push(
    { key: "referencia", label: "Referência", type: "text", colSpan: 2, hideInList: true },
    { key: "condicoes_pagamento", label: "Condições de pagamento", type: "textarea", colSpan: 2, hideInList: true },
    { key: "referencias_comerciais", label: "Referências comerciais", type: "textarea", colSpan: 2, hideInList: true },
    { key: "referencias_bancarias", label: "Referências bancárias", type: "textarea", colSpan: 2, hideInList: true },
  );
  return fields;
}

export function badgeAtivo(v) {
  return v ? '<span class="badge badge-ok">Ativo</span>' : '<span class="badge badge-mut">Inativo</span>';
}
