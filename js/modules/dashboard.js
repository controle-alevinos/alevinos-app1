import { supabase } from "../supabaseClient.js";
import { fmtInt, fmtNumber, fmtMoney, periodoRange } from "../utils.js";

const PESOS_PADRAO = [15, 20, 25, 30, 35, 40, 100, 200, 300, 400, 500, 600, 700];
let chartCA = null, chartPrevisao = null;

// interpola peso->dias e dias->peso a partir da tabela de nutrição carregada no cliente
function fnDiasPorPeso(curva, peso) {
  const asc = [...curva].sort((a, b) => a.peso_g - b.peso_g);
  let inf = null, sup = null;
  for (const r of asc) { if (r.peso_g <= peso) inf = r; if (r.peso_g >= peso && !sup) sup = r; }
  if (!inf) return asc[0].dias;
  if (!sup) return asc[asc.length - 1].dias;
  if (inf.peso_g === sup.peso_g) return inf.dias;
  return inf.dias + (sup.dias - inf.dias) * ((peso - inf.peso_g) / (sup.peso_g - inf.peso_g));
}

// ração acumulada (kg por 1000 peixes) até X dias, somando taxa diária × dias de cada intervalo semanal
function racaoAcumuladaPor1000(curvaOrdenadaPorDias, dias) {
  let acumulado = 0;
  for (let i = 1; i < curvaOrdenadaPorDias.length; i++) {
    const anterior = curvaOrdenadaPorDias[i - 1];
    const atual = curvaOrdenadaPorDias[i];
    const intervalo = atual.dias - anterior.dias;
    if (intervalo <= 0) continue;
    const taxaDiaria = atual.racao_1000_peixes_kg_dia ?? anterior.racao_1000_peixes_kg_dia ?? 0;
    if (atual.dias <= dias) {
      acumulado += taxaDiaria * intervalo;
    } else if (anterior.dias < dias) {
      acumulado += taxaDiaria * (dias - anterior.dias);
      break;
    } else {
      break;
    }
  }
  return acumulado;
}

async function carregarKpisReais() {
  const { data: lotes } = await supabase.from("v_ca_custo_lote").select("*").eq("status", "ativo");
  const rows = lotes || [];
  const totalRacao = rows.reduce((s, r) => s + Number(r.racao_total_kg || 0), 0);
  const totalCusto = rows.reduce((s, r) => s + Number(r.custo_racao_total || 0), 0);
  const totalGanhoBiomassa = rows.reduce((s, r) => s + Math.max(Number(r.ganho_biomassa_kg || 0), 0), 0);
  const totalEstoque = rows.reduce((s, r) => s + Number(r.estoque_atual || 0), 0);
  const totalBiomassaAtual = rows.reduce((s, r) => s + (Number(r.estoque_atual || 0) * Number(r.peso_estimado_atual_g || 0)) / 1000, 0);
  const caGeral = totalGanhoBiomassa > 0 ? totalRacao / totalGanhoBiomassa : null;
  const custoPorKg = totalBiomassaAtual > 0 ? totalCusto / totalBiomassaAtual : null;
  const custoPorPeixe = totalEstoque > 0 ? totalCusto / totalEstoque : null;
  return { rows, caGeral, custoPorKg, custoPorPeixe, totalEstoque, totalBiomassaAtual, totalRacao, totalCusto };
}

async function carregarMortalidadeMes() {
  const { ini, fim } = periodoRange("mes_atual");
  const { data } = await supabase.from("mortalidades").select("quantidade").gte("data_referencia", ini).lte("data_referencia", fim);
  return (data || []).reduce((s, r) => s + Number(r.quantidade || 0), 0);
}

async function carregarTanquesOcupados() {
  const { data } = await supabase.from("v_tanque_status").select("id,lote_id,ativo");
  const total = (data || []).filter((t) => t.ativo).length;
  const ocupados = (data || []).filter((t) => t.lote_id).length;
  return { total, ocupados };
}

async function precoMedioRacao() {
  const { data } = await supabase.from("racoes").select("preco_unitario_kg").eq("ativo", true);
  const rows = (data || []).filter((r) => r.preco_unitario_kg);
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + Number(r.preco_unitario_kg), 0) / rows.length;
}

function renderPrevisaoTable(curva, preco) {
  const asc = [...curva].sort((a, b) => a.dias - b.dias);
  return PESOS_PADRAO.map((peso) => {
    const dias = fnDiasPorPeso(curva, peso);
    const racao1000 = racaoAcumuladaPor1000(asc, dias);
    const custoPorPeixe = (racao1000 / 1000) * preco;
    const custoPorKg = peso > 0 ? custoPorPeixe / (peso / 1000) : null;
    return { peso, dias, racao1000, custoPorPeixe, custoPorKg };
  });
}

export async function render(container) {
  container.innerHTML = `<div class="loading">Carregando dashboard...</div>`;

  const [{ rows, caGeral, custoPorKg, custoPorPeixe, totalEstoque, totalBiomassaAtual }, mortalidadeMes, tanques, preco, curvaResp] =
    await Promise.all([
      carregarKpisReais(),
      carregarMortalidadeMes(),
      carregarTanquesOcupados(),
      precoMedioRacao(),
      supabase.from("tabela_nutricao").select("dias,peso_g,racao_1000_peixes_kg_dia").order("dias"),
    ]);
  const curva = curvaResp.data || [];
  const previsao = renderPrevisaoTable(curva, preco);

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">CV — Conversão Alimentar (CA)</div>
        <div class="kpi-value">${caGeral !== null ? fmtNumber(caGeral, 2) : "—"}</div>
        <div class="kpi-sub">kg de ração / kg de peixe ganho (lotes ativos)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Custo do peixe hoje (R$/kg)</div>
        <div class="kpi-value">${custoPorKg !== null ? fmtMoney(custoPorKg) : "—"}</div>
        <div class="kpi-sub">Ração acumulada ÷ biomassa atual</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Custo do peixe hoje (R$/un.)</div>
        <div class="kpi-value">${custoPorPeixe !== null ? fmtMoney(custoPorPeixe) : "—"}</div>
        <div class="kpi-sub">Custo de ração por peixe em estoque</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Estoque total de peixes</div>
        <div class="kpi-value">${fmtInt(totalEstoque)}</div>
        <div class="kpi-sub">${fmtNumber(totalBiomassaAtual)} kg de biomassa estimada</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tanques ocupados</div>
        <div class="kpi-value">${tanques.ocupados} / ${tanques.total}</div>
        <div class="kpi-sub">com lote ativo no momento</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mortalidade no mês atual</div>
        <div class="kpi-value">${fmtInt(mortalidadeMes)}</div>
        <div class="kpi-sub">peixes, mês corrente</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">CA e custo por lote ativo</div></div>
        <div class="chart-box"><canvas id="chart-ca-lote"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Previsão de custo do peixe por peso-alvo</div></div>
        <div class="chart-box"><canvas id="chart-previsao"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Previsão de custo do peixe — por peso-alvo (g)</div>
        <div class="toolbar">
          <input type="number" id="peso-custom" class="search-input" placeholder="Outro peso (g)" style="max-width:150px;" />
          <button class="btn btn-primary" id="btn-peso-custom">Calcular</button>
        </div>
      </div>
      <p class="small-muted">Estimativa com base na curva de nutrição de referência (Aba 7) e no preço médio atual das rações cadastradas
        (${fmtMoney(preco)}/kg). Não inclui o custo de aquisição dos alevinos nem custos fixos/mão de obra — veja sugestões de melhoria no README.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Peso alvo (g)</th><th>Dias estimados</th><th>Ração acumulada (kg/1000 peixes)</th><th>Custo por peixe</th><th>Custo por kg</th></tr></thead>
          <tbody id="tbody-previsao">
            ${previsao.map((p) => `<tr><td>${p.peso}g</td><td>${fmtInt(Math.round(p.dias))}</td><td>${fmtNumber(p.racao1000)}</td><td>${fmtMoney(p.custoPorPeixe)}</td><td>${fmtMoney(p.custoPorKg)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Lotes ativos — detalhe</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Lote</th><th>Tanque</th><th>Estoque</th><th>Peso médio est. (g)</th><th>Ração consumida (kg)</th><th>Custo ração</th><th>CA realizada</th></tr></thead>
          <tbody>
            ${rows.map((r) => `<tr><td>${r.codigo}</td><td>${r.tanque_numero}</td><td>${fmtInt(r.estoque_atual)}</td><td>${fmtNumber(r.peso_estimado_atual_g)}</td><td>${fmtNumber(r.racao_total_kg)}</td><td>${fmtMoney(r.custo_racao_total)}</td><td>${r.ca_realizada ? fmtNumber(r.ca_realizada) : "—"}</td></tr>`).join("") || `<tr><td colspan="7" class="empty-state">Nenhum lote ativo no momento.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;

  if (chartCA) chartCA.destroy();
  chartCA = new Chart(document.getElementById("chart-ca-lote"), {
    type: "bar",
    data: { labels: rows.map((r) => r.codigo), datasets: [{ label: "CA realizada", data: rows.map((r) => r.ca_realizada || 0), backgroundColor: "rgba(15,118,110,.6)" }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  if (chartPrevisao) chartPrevisao.destroy();
  chartPrevisao = new Chart(document.getElementById("chart-previsao"), {
    type: "line",
    data: { labels: previsao.map((p) => p.peso + "g"), datasets: [{ label: "Custo por kg (R$)", data: previsao.map((p) => p.custoPorKg), borderColor: "#0f766e", backgroundColor: "rgba(15,118,110,.15)", fill: true, tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  document.getElementById("btn-peso-custom").onclick = () => {
    const peso = Number(document.getElementById("peso-custom").value);
    if (!peso || peso <= 0) return;
    const asc = [...curva].sort((a, b) => a.dias - b.dias);
    const dias = fnDiasPorPeso(curva, peso);
    const racao1000 = racaoAcumuladaPor1000(asc, dias);
    const custoPorPeixe = (racao1000 / 1000) * preco;
    const custoPorKg = custoPorPeixe / (peso / 1000);
    document.getElementById("tbody-previsao").insertAdjacentHTML("afterbegin",
      `<tr style="background:var(--brand-light)"><td>${peso}g *</td><td>${fmtInt(Math.round(dias))}</td><td>${fmtNumber(racao1000)}</td><td>${fmtMoney(custoPorPeixe)}</td><td>${fmtMoney(custoPorKg)}</td></tr>`);
  };
}
