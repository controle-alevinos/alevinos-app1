import { renderCrudPage } from "../crud.js";
import { supabase } from "../supabaseClient.js";
import { fmtInt, fmtNumber } from "../utils.js";

function tanqueLabel(r) {
  return `Tanque ${String(r.numero).padStart(2, "0")}${r.lote_atual ? " (lote: " + r.lote_atual + ")" : " (sem lote ativo)"}`;
}

function biometriaRowHtml(item = {}, idx = 0) {
  return `<div class="biometria-row" data-idx="${idx}" style="display:flex;gap:8px;margin-bottom:6px;align-items:center;">
    <input type="number" step="0.01" class="bio-peso" placeholder="Biometria (g)" value="${item.biometria_g ?? ""}" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;"/>
    <input type="number" class="bio-qtd" placeholder="Quantidade" value="${item.quantidade ?? ""}" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;"/>
    <button type="button" class="btn btn-sm btn-danger bio-remove">✕</button>
  </div>`;
}

function renderBiometriasCustom(value) {
  const items = Array.isArray(value) && value.length ? value : [{}];
  return `<div id="biometrias-list">${items.map((it, i) => biometriaRowHtml(it, i)).join("")}</div>
    <button type="button" class="btn btn-sm" id="bio-add">+ Adicionar biometria</button>
    <div class="small-muted" id="bio-total" style="margin-top:8px;"></div>`;
}

function readBiometrias() {
  const list = document.getElementById("biometrias-list");
  const rows = [...list.querySelectorAll(".biometria-row")];
  return rows
    .map((r) => ({
      biometria_g: parseFloat(r.querySelector(".bio-peso").value) || 0,
      quantidade: parseInt(r.querySelector(".bio-qtd").value) || 0,
    }))
    .filter((x) => x.quantidade > 0 && x.biometria_g > 0);
}

function attachBiometriasHandlers() {
  const list = document.getElementById("biometrias-list");
  const totalBox = document.getElementById("bio-total");
  function updateTotal() {
    let q = 0, peso = 0;
    list.querySelectorAll(".biometria-row").forEach((r) => {
      const qtd = parseFloat(r.querySelector(".bio-qtd").value) || 0;
      const p = parseFloat(r.querySelector(".bio-peso").value) || 0;
      q += qtd; peso += qtd * p;
    });
    totalBox.textContent = q > 0 ? `Total: ${q} peixes · peso médio ${(peso / q).toFixed(1)}g · biomassa ${(peso / 1000).toFixed(1)}kg` : "";
  }
  list.addEventListener("input", updateTotal);
  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("bio-remove")) {
      if (list.querySelectorAll(".biometria-row").length > 1) { e.target.closest(".biometria-row").remove(); updateTotal(); }
    }
  });
  document.getElementById("bio-add").onclick = () => {
    list.insertAdjacentHTML("beforeend", biometriaRowHtml({}, list.children.length));
    updateTotal();
  };
  updateTotal();
}

async function mostrarEstoqueAtual() {
  const sel = document.getElementById("fld-tanque_id");
  if (!sel) return;
  const box = document.createElement("div");
  box.className = "suggestion-box";
  box.id = "estoque-info-box";
  box.textContent = "Selecione um tanque para ver o estoque atual.";
  sel.closest(".field").insertAdjacentElement("afterend", box);
  sel.addEventListener("change", async () => {
    if (!sel.value) return;
    const { data } = await supabase.from("v_tanque_status").select("*").eq("id", sel.value).maybeSingle();
    if (data && data.estoque_atual !== null) {
      box.innerHTML = `Estoque atual: <b>${fmtInt(data.estoque_atual)} peixes</b> · peso médio estimado <b>${fmtNumber(data.peso_estimado_atual_g)}g</b> · biomassa <b>${fmtNumber(data.biomassa_atual_kg)}kg</b>.`;
    } else {
      box.textContent = "Este tanque não possui lote ativo.";
    }
  });
}

export const config = {
  table: "despescas",
  title: "Despesca",
  newLabel: "Nova despesca",
  orderBy: { column: "data_despesca", ascending: false },
  searchable: ["observacao"],
  selectExpr: "*, tanques(numero), clientes(nome_cliente)",
  wideForm: true,
  fields: [
    { key: "data_despesca", label: "Data da despesca", type: "date", required: true, default: new Date().toISOString().slice(0, 10), showInList: true },
    { key: "tanque_id", label: "Tanque", type: "fk", required: true, fkTable: "tanques", fkSelect: "id,numero,lote_atual", fkLabelFn: tanqueLabel, fkOrder: "numero", showInList: true, listFormat: (v, row) => row.tanques?.numero ? "Tanque " + String(row.tanques.numero).padStart(2, "0") : "—" },
    { key: "cliente_id", label: "Cliente (opcional)", type: "fk", fkTable: "clientes", fkLabel: "nome_cliente", showInList: true, listFormat: (v, row) => row.clientes?.nome_cliente || "—" },
    { key: "biometrias", label: "Biometrias e quantidades despescadas", type: "custom", required: true, colSpan: 2, renderCustom: renderBiometriasCustom, readCustom: readBiometrias, hint: "Lance quantas linhas de peso/quantidade forem necessárias — o sistema soma tudo automaticamente." },
    { key: "quantidade_total", label: "Qtd. total despescada", type: "number", showInList: true, hideInForm: true, computed: true, listFormat: (v) => fmtInt(v) },
    { key: "peso_medio_g", label: "Peso médio (g)", type: "number", showInList: true, hideInForm: true, computed: true, listFormat: (v) => fmtNumber(v) },
    { key: "observacao", label: "Observação", type: "textarea", colSpan: 2, hideInList: true },
  ],
  onFormMount: (row) => { attachBiometriasHandlers(); mostrarEstoqueAtual(); },
  beforeSave: (payload) => {
    if (!payload.biometrias || !payload.biometrias.length) throw new Error("Informe ao menos uma biometria/quantidade.");
    return payload;
  },
};

export function render(container) {
  renderCrudPage(container, config);
}
