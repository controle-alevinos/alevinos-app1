import { supabase } from "../supabaseClient.js";
import { fmtNumber } from "../utils.js";

export async function render(container) {
  container.innerHTML = `<div class="card"><div class="loading">Carregando tabela de nutrição...</div></div>`;
  const { data, error } = await supabase.from("tabela_nutricao").select("*").order("ordem");
  if (error) { container.innerHTML = `<div class="card">Erro: ${error.message}</div>`; return; }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Curva de crescimento — referência para sugestão de trato</div>
      </div>
      <p class="small-muted">Esta tabela é a base usada pelo sistema para sugerir automaticamente a taxa de alimentação,
        a ração recomendada e o pellet ideal em <b>Alimentação (Aba 8)</b>, a partir do peso médio estimado de cada lote.
        Os valores foram importados do arquivo enviado (curva de tilápia até 24 semanas / ~740g) e podem ser ajustados
        por um administrador conforme sua espécie/manejo.</p>
      <div class="chart-box"><canvas id="chart-crescimento"></canvas></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Semana</th><th>Dias</th><th>Fase</th><th>Peso (g)</th><th>Comprim. (cm)</th>
            <th>PB (%)</th><th>Taxa alim. (%PV/dia)</th><th>Ração/1000 peixes (kg/dia)</th>
            <th>Frequência (v/dia)</th><th>CA esperada</th><th>Pellet</th><th>Produto de referência</th><th>Sistema</th>
          </tr></thead>
          <tbody>
            ${data.map((r) => `<tr>
              <td>${r.semana}</td><td>${r.dias}</td><td>${r.fase}</td><td>${fmtNumber(r.peso_g)}</td>
              <td>${r.comprimento_cm ?? "—"}</td><td>${r.pb_percent ?? "—"}</td><td>${r.taxa_alimentacao_pct ?? "—"}</td>
              <td>${r.racao_1000_peixes_kg_dia ?? "—"}</td><td>${r.frequencia_dia ?? "—"}</td><td>${r.ca_esperada ?? "—"}</td>
              <td>${r.pellet_mm ?? "—"}</td><td>${r.produto_referencia ?? "—"}</td><td>${r.sistema_recomendado ?? "—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;

  const ctx = document.getElementById("chart-crescimento");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((r) => r.dias + "d"),
      datasets: [{
        label: "Peso esperado (g)",
        data: data.map((r) => r.peso_g),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15,118,110,.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { title: { display: true, text: "Peso (g)" } }, x: { title: { display: true, text: "Dias de cultivo" } } },
    },
  });
}
