import { renderCrudPage } from "../crud.js";
import { fmtNumber, fmtInt } from "../utils.js";

function simNao(v) {
  return v ? '<span class="badge badge-ok">Sim</span>' : '<span class="badge badge-mut">Não</span>';
}

export const config = {
  table: "tanques",
  title: "Cadastro de Tanque",
  newLabel: "Novo tanque",
  canInsert: true,
  canDelete: true,
  orderBy: { column: "numero" },
  searchable: ["numero", "nome", "lote_atual"],
  wideForm: true,
  fields: [
    { key: "numero", label: "Número do tanque", type: "number", required: true, showInList: true, min: 1 },
    { key: "nome", label: "Nome / identificação", type: "text", showInList: true },
    { key: "lote_atual", label: "Lote atual", type: "text", readOnly: true, showInList: true, hint: "Preenchido automaticamente pelo módulo de Povoamento.", computed: true },
    { key: "largura_m", label: "Largura (m)", type: "number", step: "0.01", hideInList: true },
    { key: "comprimento_m", label: "Comprimento (m)", type: "number", step: "0.01", hideInList: true },
    { key: "profundidade_m", label: "Profundidade (m)", type: "number", step: "0.01", hideInList: true },
    { key: "lamina_agua_m2", label: "Lâmina d'água (m²)", type: "number", showInList: true, listFormat: (v) => fmtNumber(v), hideInForm: true, computed: true },
    { key: "volume_m3", label: "Volume / quantidade (m³)", type: "number", showInList: true, listFormat: (v) => fmtNumber(v), hideInForm: true, computed: true },
    { key: "capacidade_biomassa_kg", label: "Capacidade de biomassa (kg)", type: "number", step: "0.01", hideInList: true },
    { key: "capacidade_alevinos", label: "Capacidade de alevinos (un.)", type: "number", hideInList: true },
    { key: "tem_estufa", label: "Estufa", type: "checkbox", checkboxLabel: "Possui estufa", hideInList: true },
    { key: "tem_rede_anti_passaros", label: "Rede anti-pássaros", type: "checkbox", checkboxLabel: "Possui rede anti-pássaros", hideInList: true },
    { key: "tem_aeradores_pas", label: "Aeradores de pás", type: "checkbox", checkboxLabel: "Possui aeradores de pás", hideInList: true },
    { key: "qtd_aeradores_pas", label: "Qtd. aeradores de pás", type: "number", hideInList: true },
    { key: "tem_aeradores_chafariz", label: "Aeradores chafariz", type: "checkbox", checkboxLabel: "Possui aeradores chafariz", hideInList: true },
    { key: "qtd_aeradores_chafariz", label: "Qtd. aeradores chafariz", type: "number", hideInList: true },
    { key: "tem_alimentador_automatico", label: "Alimentador automático", type: "checkbox", checkboxLabel: "Possui alimentador automático", hideInList: true },
    { key: "qtd_alimentador_automatico", label: "Qtd. alimentadores automáticos", type: "number", hideInList: true },
    { key: "tem_automacao", label: "Automação", type: "checkbox", checkboxLabel: "Possui automação", hideInList: true },
    { key: "tem_cftv", label: "Câmeras CFTV", type: "checkbox", checkboxLabel: "Possui câmeras CFTV", hideInList: true },
    { key: "tem_lixeira", label: "Lixeira", type: "checkbox", checkboxLabel: "Possui lixeira", hideInList: true },
    { key: "tem_portao", label: "Portão", type: "checkbox", checkboxLabel: "Possui portão", hideInList: true },
    { key: "ativo", label: "Tanque ativo", type: "checkbox", default: true, checkboxLabel: "Ativo", listFormat: simNao, showInList: true },
  ],
};

export function render(container) {
  renderCrudPage(container, config);
}
