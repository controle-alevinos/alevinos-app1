// =====================================================================
// UTILITÁRIOS: formatação, máscaras, datas, toast, modal
// =====================================================================

export function fmtMoney(v) {
  if (v === null || v === undefined || v === "") return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function fmtNumber(v, dec = 2) {
  if (v === null || v === undefined || v === "") return "—";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function fmtInt(v) {
  if (v === null || v === undefined || v === "") return "—";
  return Number(v).toLocaleString("pt-BR");
}
export function fmtDate(v) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v + (v.length === 10 ? "T00:00:00" : "")) : v;
  if (isNaN(d)) return v;
  return d.toLocaleDateString("pt-BR");
}
export function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleString("pt-BR");
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Máscara de telefone (xx)xxxx-xxxx ou (xx)xxxxx-xxxx
export function maskPhone(value) {
  let v = (value || "").replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d)/, "($1)$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    v = v.replace(/(\d{2})(\d)/, "($1)$2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
  }
  return v;
}
export function maskCEP(value) {
  let v = (value || "").replace(/\D/g, "").slice(0, 8);
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v;
}
export function maskDocumento(value) {
  let v = (value || "").replace(/\D/g, "").slice(0, 14);
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/(\d{2})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1/$2");
    v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  return v;
}

// ---------------- Filtros de período (usado nos Relatórios) ----------------
export function periodoRange(tipo, dataIniCustom, dataFimCustom) {
  const now = new Date();
  const startOfWeek = (d) => {
    const dt = new Date(d);
    const day = dt.getDay(); // 0=domingo
    dt.setDate(dt.getDate() - day);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };
  const iso = (d) => d.toISOString().slice(0, 10);
  let ini, fim;
  switch (tipo) {
    case "semana_atual": {
      ini = startOfWeek(now);
      fim = new Date(ini); fim.setDate(fim.getDate() + 6);
      break;
    }
    case "semana_anterior": {
      const sAtual = startOfWeek(now);
      ini = new Date(sAtual); ini.setDate(ini.getDate() - 7);
      fim = new Date(ini); fim.setDate(fim.getDate() + 6);
      break;
    }
    case "mes_atual": {
      ini = new Date(now.getFullYear(), now.getMonth(), 1);
      fim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }
    case "mes_anterior": {
      ini = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      fim = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case "personalizado": {
      ini = dataIniCustom ? new Date(dataIniCustom + "T00:00:00") : new Date(now.getFullYear(), now.getMonth(), 1);
      fim = dataFimCustom ? new Date(dataFimCustom + "T00:00:00") : now;
      break;
    }
    default: {
      ini = new Date(now.getFullYear(), now.getMonth(), 1);
      fim = now;
    }
  }
  return { ini: iso(ini), fim: iso(fim) };
}

export const PERIODO_OPTIONS = [
  { value: "mes_atual", label: "Mês atual" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "semana_atual", label: "Semana atual" },
  { value: "semana_anterior", label: "Semana anterior" },
  { value: "personalizado", label: "Período personalizado" },
];

// ---------------- Toast ----------------
export function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

// ---------------- Modal genérico ----------------
export function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}
export function openModal({ title, bodyHtml, footerHtml = "", onMount = null, wide = false }) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" style="${wide ? "max-width:880px" : ""}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" id="modal-close-btn" type="button">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    </div>`;
  document.getElementById("modal-close-btn").onclick = closeModal;
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });
  if (onMount) onMount(root);
}

export function confirmDialog(msg) {
  return new Promise((resolve) => {
    openModal({
      title: "Confirmar ação",
      bodyHtml: `<p>${msg}</p>`,
      footerHtml: `
        <button class="btn" id="confirm-no">Cancelar</button>
        <button class="btn btn-danger" id="confirm-yes">Confirmar</button>`,
      onMount: () => {
        document.getElementById("confirm-no").onclick = () => { closeModal(); resolve(false); };
        document.getElementById("confirm-yes").onclick = () => { closeModal(); resolve(true); };
      },
    });
  });
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
}

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
