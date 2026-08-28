import { supabase } from "../supabaseClient.js";
import { fmtDate, fmtInt, fmtNumber, fmtMoney, PERIODO_OPTIONS, periodoRange, todayISO } from "../utils.js";

let chartInstance = null;

const REPORTS = [
  {
    key: "fornecedores", label: "Relação dos Fornecedores", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("fornecedores").select("*").gte("created_at", ini).lte("created_at", fim + "T23:59:59").order("nome_empresa");
      return data || [];
    },
    columns: [
      { key: "nome_empresa", label: "Empresa" }, { key: "cnpj_cpf", label: "CNPJ/CPF" },
      { key: "cidade", label: "Cidade" }, { key: "uf", label: "UF" }, { key: "telefone", label: "Telefone" },
      { key: "created_at", label: "Cadastrado em", format: fmtDate },
    ],
  },
  {
    key: "clientes", label: "Relação dos Clientes", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("clientes").select("*").gte("created_at", ini).lte("created_at", fim + "T23:59:59").order("nome_cliente");
      return data || [];
    },
    columns: [
      { key: "nome_cliente", label: "Cliente" }, { key: "cnpj_cpf", label: "CNPJ/CPF" },
      { key: "cidade", label: "Cidade" }, { key: "uf", label: "UF" }, { key: "telefone", label: "Telefone" },
      { key: "created_at", label: "Cadastrado em", format: fmtDate },
    ],
  },
  {
    key: "lotes", label: "Relação dos Lotes", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("v_lote_status").select("*").gte("data_abertura", ini).lte("data_abertura", fim).order("data_abertura", { ascending: false });
      return data || [];
    },
    columns: [
      { key: "codigo", label: "Lote" }, { key: "tanque_numero", label: "Tanque" }, { key: "tipo_peixe", label: "Espécie" },
      { key: "status", label: "Status" }, { key: "data_abertura", label: "Abertura", format: fmtDate },
      { key: "qtd_povoada", label: "Povoados", format: fmtInt }, { key: "estoque_atual", label: "Estoque atual", format: fmtInt },
      { key: "dias_de_cultivo", label: "Dias de cultivo", format: fmtInt },
    ],
    chart: { type: "bar", labelKey: "codigo", valueKey: "estoque_atual", label: "Estoque atual por lote" },
  },
  {
    key: "povoamento", label: "Relação do Recebimento de Alevinos", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("povoamento").select("*, tanques(numero), fornecedores(nome_empresa)").gte("data_recebimento", ini).lte("data_recebimento", fim).order("data_recebimento", { ascending: false });
      return (data || []).map((r) => ({ ...r, tanque_numero: r.tanques?.numero, fornecedor_nome: r.fornecedores?.nome_empresa }));
    },
    columns: [
      { key: "data_recebimento", label: "Data", format: fmtDate }, { key: "tanque_numero", label: "Tanque" },
      { key: "tipo_peixe", label: "Espécie" }, { key: "tamanho_peixe_g", label: "Peso (g)", format: (v) => fmtNumber(v) },
      { key: "quantidade", label: "Quantidade", format: fmtInt }, { key: "condicao", label: "Condição" },
      { key: "fornecedor_nome", label: "Fornecedor" }, { key: "controle_fornecedor", label: "NF/Pedido" },
    ],
    chart: { type: "bar", labelKey: "tipo_peixe", valueKey: "quantidade", label: "Alevinos recebidos por espécie", aggregate: "sum" },
  },
  {
    key: "mortalidades", label: "Relação das Mortalidades", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("mortalidades").select("*, tanques(numero)").gte("data_referencia", ini).lte("data_referencia", fim).order("data_referencia", { ascending: false });
      return (data || []).map((r) => ({ ...r, tanque_numero: r.tanques?.numero }));
    },
    columns: [
      { key: "data_referencia", label: "Data", format: fmtDate }, { key: "tanque_numero", label: "Tanque" },
      { key: "quantidade", label: "Quantidade", format: fmtInt }, { key: "observacao", label: "Observação" },
    ],
    chart: { type: "bar", labelKey: "data_referencia", valueKey: "quantidade", label: "Mortalidade por data", aggregate: "sum", labelFormat: fmtDate },
  },
  {
    key: "biometrias", label: "Relação das Biometrias", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("v_biometrias").select("*").gte("data", ini).lte("data", fim).order("data", { ascending: false });
      return data || [];
    },
    columns: [
      { key: "data", label: "Data", format: fmtDate }, { key: "tanque_numero", label: "Tanque" }, { key: "lote_codigo", label: "Lote" },
      { key: "peso_medio_g", label: "Peso médio (g)", format: fmtNumber }, { key: "quantidade_total", label: "Quantidade", format: fmtInt },
      { key: "nome_cliente", label: "Cliente" },
    ],
    chart: { type: "line", labelKey: "data", valueKey: "peso_medio_g", label: "Evolução do peso médio (biometrias)", labelFormat: fmtDate },
  },
  {
    key: "despescas", label: "Relação das Despescas", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("despescas").select("*, tanques(numero), clientes(nome_cliente)").gte("data_despesca", ini).lte("data_despesca", fim).order("data_despesca", { ascending: false });
      return (data || []).map((r) => ({ ...r, tanque_numero: r.tanques?.numero, cliente_nome: r.clientes?.nome_cliente }));
    },
    columns: [
      { key: "data_despesca", label: "Data", format: fmtDate }, { key: "tanque_numero", label: "Tanque" },
      { key: "quantidade_total", label: "Qtd. despescada", format: fmtInt }, { key: "peso_medio_g", label: "Peso médio (g)", format: fmtNumber },
      { key: "cliente_nome", label: "Cliente" },
    ],
    chart: { type: "bar", labelKey: "data_despesca", valueKey: "quantidade_total", label: "Quantidade despescada por data", labelFormat: fmtDate },
  },
  {
    key: "empregados", label: "Relação dos Empregados", dateless: true,
    fetch: async () => {
      const { data } = await supabase.from("funcionarios").select("*").order("nome");
      return data || [];
    },
    columns: [
      { key: "nome", label: "Nome" }, { key: "cargo", label: "Cargo" }, { key: "papel", label: "Perfil" },
      { key: "salario", label: "Salário", format: fmtMoney }, { key: "data_admissao", label: "Admissão", format: fmtDate },
      { key: "ativo", label: "Ativo", format: (v) => (v ? "Sim" : "Não") },
    ],
  },
  {
    key: "gastos_racao", label: "Relação dos Gastos de Ração por Lote", dateless: false,
    fetch: async (ini, fim) => {
      const { data } = await supabase.from("alimentacao").select("*, lotes(codigo), tanques(numero), racoes(nome_racao)").gte("data_trato", ini).lte("data_trato", fim);
      const map = {};
      (data || []).forEach((r) => {
        const key = r.lote_id || "sem-lote";
        if (!map[key]) map[key] = { lote_codigo: r.lotes?.codigo || "—", tanque_numero: r.tanques?.numero, quantidade_kg: 0, custo_total: 0 };
        map[key].quantidade_kg += Number(r.quantidade_kg || 0);
        map[key].custo_total += Number(r.custo_estimado || 0);
      });
      return Object.values(map).sort((a, b) => b.custo_total - a.custo_total);
    },
    columns: [
      { key: "lote_codigo", label: "Lote" }, { key: "tanque_numero", label: "Tanque" },
      { key: "quantidade_kg", label: "Ração (kg)", format: (v) => fmtNumber(v) }, { key: "custo_total", label: "Custo total", format: fmtMoney },
    ],
    chart: { type: "bar", labelKey: "lote_codigo", valueKey: "custo_total", label: "Gasto de ração por lote (R$)" },
  },
];

function buildChart(report, rows) {
  const canvasWrap = document.getElementById("relatorio-chart-wrap");
  if (!report.chart || !rows.length) { canvasWrap.style.display = "none"; return; }
  canvasWrap.style.display = "";
  const { labelKey, valueKey, type, label, aggregate, labelFormat } = report.chart;
  let labels, values;
  if (aggregate === "sum") {
    const agg = {};
    rows.forEach((r) => { const k = r[labelKey]; agg[k] = (agg[k] || 0) + Number(r[valueKey] || 0); });
    labels = Object.keys(agg); values = Object.values(agg);
  } else {
    labels = rows.map((r) => (labelFormat ? labelFormat(r[labelKey]) : r[labelKey]));
    values = rows.map((r) => Number(r[valueKey] || 0));
  }
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById("relatorio-chart"), {
    type,
    data: { labels, datasets: [{ label, data: values, backgroundColor: "rgba(15,118,110,.55)", borderColor: "#0f766e", fill: type === "line", tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });
}

async function loadReport(container) {
  const key = document.getElementById("rel-select").value;
  const report = REPORTS.find((r) => r.key === key);
  const periodoTipo = document.getElementById("rel-periodo").value;
  const custom = periodoTipo === "personalizado";
  document.getElementById("rel-custom-dates").style.display = custom ? "flex" : "none";
  const { ini, fim } = periodoRange(periodoTipo, document.getElementById("rel-ini")?.value, document.getElementById("rel-fim")?.value);

  const tableWrap = document.getElementById("relatorio-table-wrap");
  tableWrap.innerHTML = `<div class="loading">Carregando...</div>`;
  const rows = await report.fetch(ini, fim);

  if (!rows.length) {
    tableWrap.innerHTML = `<div class="empty-state">Nenhum registro no período selecionado.</div>`;
    document.getElementById("relatorio-chart-wrap").style.display = "none";
    return;
  }
  tableWrap.innerHTML = `<table><thead><tr>${report.columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${report.columns.map((c) => `<td>${c.format ? c.format(r[c.key]) : (r[c.key] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  buildChart(report, rows);
}

export function render(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <select id="rel-select" class="filter-select"></select>
          <select id="rel-periodo" class="filter-select">${PERIODO_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}</select>
          <div id="rel-custom-dates" style="display:none;gap:8px;align-items:center;">
            <input type="date" id="rel-ini" class="search-input" value="${todayISO()}" />
            <span class="small-muted">até</span>
            <input type="date" id="rel-fim" class="search-input" value="${todayISO()}" />
          </div>
          <button class="btn btn-primary" id="rel-apply">Aplicar filtro</button>
        </div>
      </div>
      <div id="relatorio-chart-wrap" class="chart-box" style="display:none;margin-bottom:16px;"><canvas id="relatorio-chart"></canvas></div>
      <div class="table-wrap" id="relatorio-table-wrap"></div>
    </div>`;

  const sel = document.getElementById("rel-select");
  sel.innerHTML = REPORTS.map((r) => `<option value="${r.key}">${r.label}</option>`).join("");
  sel.onchange = () => loadReport(container);
  document.getElementById("rel-periodo").onchange = () => loadReport(container);
  document.getElementById("rel-apply").onclick = () => loadReport(container);

  loadReport(container);
}
