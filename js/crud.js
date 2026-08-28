// =====================================================================
// MOTOR GENÉRICO DE CADASTRO (lista + formulário) usado pela maioria das
// abas. Cada módulo (js/modules/*.js) só declara os campos; este arquivo
// cuida de renderizar tabela, modal de formulário, máscaras, FKs, CRUD.
// =====================================================================
import { supabase } from "./supabaseClient.js";
import { toast, openModal, closeModal, confirmDialog, maskPhone, maskCEP, maskDocumento, fmtDate, fmtMoney, fmtInt, fmtNumber, el } from "./utils.js";
import { isAdmin } from "./auth.js";

const fkCache = {};
export async function loadFkOptions(table, labelExpr, extraSelect = "id", orderCol = null, labelFn = null, filterFn = null) {
  const key = table + "|" + labelExpr + "|" + (labelFn ? "fn" : "") + "|" + (filterFn ? "filt" : "");
  if (fkCache[key]) return fkCache[key];
  const selectCols = labelFn ? `${extraSelect},${labelExpr}` : `${extraSelect},${labelExpr}`;
  let query = supabase.from(table).select(selectCols);
  if (orderCol) query = query.order(orderCol);
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  let rows = data || [];
  if (filterFn) rows = rows.filter(filterFn);
  const opts = rows.map((r) => ({ value: r.id, label: labelFn ? labelFn(r) : labelExprValue(r, labelExpr) }));
  fkCache[key] = opts;
  return opts;
}
export function invalidateFkCache(table) {
  Object.keys(fkCache).forEach((k) => { if (k.startsWith(table + "|")) delete fkCache[k]; });
}
function labelExprValue(row, expr) {
  // suporta "campo" simples ou "a || ' - ' || b" já resolvido no backend; aqui só campo simples
  return row[expr] ?? row[Object.keys(row).find((k) => k !== "id")];
}

function applyMask(type, value) {
  if (type === "phone") return maskPhone(value);
  if (type === "cep") return maskCEP(value);
  if (type === "documento") return maskDocumento(value);
  return value;
}

function fieldInputHtml(f, value) {
  const v = value ?? f.default ?? "";
  const req = f.required ? "required" : "";
  const span = f.colSpan === 2 ? "span-2" : "";
  const disabled = f.readOnly ? "disabled" : "";
  let inputHtml = "";
  if (f.type === "select" || f.type === "fk") {
    const opts = f.options || [];
    inputHtml = `<select id="fld-${f.key}" ${req} ${disabled}>
      <option value="">${f.placeholder || "Selecione..."}</option>
      ${opts.map((o) => `<option value="${o.value}" ${String(o.value) === String(v) ? "selected" : ""}>${o.label}</option>`).join("")}
    </select>`;
  } else if (f.type === "textarea") {
    inputHtml = `<textarea id="fld-${f.key}" ${req} ${disabled}>${v ?? ""}</textarea>`;
  } else if (f.type === "checkbox") {
    inputHtml = `<div class="checkbox-field"><input type="checkbox" id="fld-${f.key}" ${v ? "checked" : ""} ${disabled}/> <span class="small-muted">${f.checkboxLabel || "Sim"}</span></div>`;
  } else if (f.type === "number") {
    inputHtml = `<input type="number" id="fld-${f.key}" value="${v ?? ""}" step="${f.step || "any"}" ${f.min !== undefined ? `min="${f.min}"` : ""} ${req} ${disabled}/>`;
  } else if (f.type === "date") {
    inputHtml = `<input type="date" id="fld-${f.key}" value="${v ?? ""}" ${req} ${disabled}/>`;
  } else if (f.type === "time") {
    inputHtml = `<input type="time" id="fld-${f.key}" value="${v ?? ""}" ${req} ${disabled}/>`;
  } else if (f.type === "phone" || f.type === "cep" || f.type === "documento") {
    inputHtml = `<input type="text" id="fld-${f.key}" value="${v ?? ""}" placeholder="${f.placeholder || ""}" ${req} ${disabled}/>`;
  } else if (f.type === "custom") {
    return `<div class="field ${span}" id="fldwrap-${f.key}"><label>${f.label}${f.required ? " *" : ""}</label>
      <div id="fld-${f.key}">${f.renderCustom ? f.renderCustom(v) : ""}</div>
      ${f.hint ? `<div class="hint">${f.hint}</div>` : ""}
    </div>`;
  } else {
    inputHtml = `<input type="text" id="fld-${f.key}" value="${v ?? ""}" placeholder="${f.placeholder || ""}" ${req} ${disabled}/>`;
  }
  return `<div class="field ${span}">
    <label>${f.label}${f.required ? " *" : ""}</label>
    ${inputHtml}
    ${f.hint ? `<div class="hint">${f.hint}</div>` : ""}
  </div>`;
}

async function resolveOptionsForFields(fields) {
  for (const f of fields) {
    if (f.type === "fk" && f.fkTable) {
      f.options = await loadFkOptions(f.fkTable, f.fkLabel, f.fkSelect || "id", f.fkOrder, f.fkLabelFn, f.fkFilterFn);
    }
  }
}

function readFormValues(fields) {
  const payload = {};
  for (const f of fields) {
    if (f.computed) continue;
    if (f.type === "custom") {
      if (f.readCustom) payload[f.key] = f.readCustom();
      continue;
    }
    const input = document.getElementById(`fld-${f.key}`);
    if (!input) continue;
    let val;
    if (f.type === "checkbox") val = input.checked;
    else if (f.type === "number") val = input.value === "" ? null : Number(input.value);
    else val = input.value === "" ? null : input.value;
    if (f.type === "fk" && val) val = val; // uuid string
    payload[f.key] = val;
  }
  return payload;
}

function attachMaskListeners(fields) {
  fields.forEach((f) => {
    if (["phone", "cep", "documento"].includes(f.type)) {
      const input = document.getElementById(`fld-${f.key}`);
      if (input) input.addEventListener("input", () => { input.value = applyMask(f.type, input.value); });
    }
  });
}

export async function openForm(config, row = null) {
  await resolveOptionsForFields(config.fields);
  const isEdit = !!row;
  const bodyHtml = `<form id="crud-form"><div class="form-grid">
    ${config.fields.filter((f) => !f.hideInForm).map((f) => fieldInputHtml(f, row ? row[f.key] : undefined)).join("")}
  </div></form>`;
  openModal({
    title: isEdit ? `Editar — ${config.title}` : `Novo — ${config.title}`,
    bodyHtml,
    wide: config.wideForm,
    footerHtml: `<button class="btn" id="frm-cancel" type="button">Cancelar</button>
      <button class="btn btn-primary" id="frm-save" type="button">${isEdit ? "Salvar alterações" : "Cadastrar"}</button>`,
    onMount: () => {
      attachMaskListeners(config.fields);
      if (config.onFormMount) config.onFormMount(row);
      document.getElementById("frm-cancel").onclick = closeModal;
      document.getElementById("frm-save").onclick = async () => {
        const form = document.getElementById("crud-form");
        if (!form.reportValidity()) return;
        let payload = readFormValues(config.fields);
        try {
          if (config.beforeSave) payload = (await config.beforeSave(payload, row)) || payload;
          if (isEdit) {
            const { error } = await supabase.from(config.table).update(payload).eq("id", row.id);
            if (error) throw error;
            toast("Registro atualizado.", "ok");
          } else {
            const { error } = await supabase.from(config.table).insert(payload);
            if (error) throw error;
            toast("Registro cadastrado.", "ok");
          }
          invalidateFkCache(config.table);
          closeModal();
          config.onSaved && config.onSaved();
        } catch (err) {
          toast("Erro: " + err.message, "err");
        }
      };
    },
  });
}

function cellValue(f, row) {
  const raw = row[f.key];
  if (f.listFormat) return f.listFormat(raw, row);
  if (f.type === "checkbox") return raw ? '<span class="badge badge-ok">Sim</span>' : '<span class="badge badge-mut">Não</span>';
  if (f.type === "date") return fmtDate(raw);
  if (f.type === "select" || f.type === "fk") {
    const opt = (f.options || []).find((o) => String(o.value) === String(raw));
    return opt ? opt.label : (raw ?? "—");
  }
  return raw ?? "—";
}

export async function renderCrudPage(container, config) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="toolbar">
          <input type="text" class="search-input" id="crud-search" placeholder="Buscar..." />
        </div>
        ${config.canInsert !== false ? `<button class="btn btn-primary" id="crud-new">+ ${config.newLabel || "Novo"}</button>` : ""}
      </div>
      <div class="table-wrap" id="crud-table-wrap"><div class="loading">Carregando...</div></div>
    </div>`;

  await resolveOptionsForFields(config.fields);

  async function fetchRows(term = "") {
    let query = supabase.from(config.viewOrTable || config.table).select(config.selectExpr || "*");
    if (config.orderBy) query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending !== false });
    const { data, error } = await query;
    if (error) { toast("Erro ao carregar: " + error.message, "err"); return []; }
    let rows = data || [];
    if (term) {
      const t = term.toLowerCase();
      rows = rows.filter((r) => config.searchable.some((k) => String(r[k] ?? "").toLowerCase().includes(t)));
    }
    return rows;
  }

  function renderTable(rows) {
    const wrap = document.getElementById("crud-table-wrap");
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state">Nenhum registro encontrado.</div>`;
      return;
    }
    const listFields = config.fields.filter((f) => f.showInList !== false && !f.hideInList);
    wrap.innerHTML = `<table>
      <thead><tr>${listFields.map((f) => `<th>${f.shortLabel || f.label}</th>`).join("")}<th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-id="${r.id}">
        ${listFields.map((f) => `<td>${cellValue(f, r)}</td>`).join("")}
        <td class="row-actions">
          <button class="btn btn-sm btn-icon" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
          ${config.canDelete !== false ? `<button class="btn btn-sm btn-icon" data-act="del" data-id="${r.id}" title="Excluir">🗑️</button>` : ""}
          ${config.rowExtraButtons ? config.rowExtraButtons(r) : ""}
        </td>
      </tr>`).join("")}</tbody>
    </table>`;

    wrap.querySelectorAll('[data-act="edit"]').forEach((btn) => {
      btn.onclick = () => {
        const row = rows.find((r) => r.id === btn.dataset.id);
        openForm({ ...config, onSaved: reload }, row);
      };
    });
    wrap.querySelectorAll('[data-act="del"]').forEach((btn) => {
      btn.onclick = async () => {
        if (!(await confirmDialog("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."))) return;
        const { error } = await supabase.from(config.table).delete().eq("id", btn.dataset.id);
        if (error) { toast("Erro ao excluir: " + error.message, "err"); return; }
        toast("Registro excluído.", "ok");
        invalidateFkCache(config.table);
        reload();
      };
    });
    if (config.onRowsRendered) config.onRowsRendered(rows);
  }

  async function reload() {
    const term = document.getElementById("crud-search")?.value || "";
    renderTable(await fetchRows(term));
  }

  document.getElementById("crud-search").addEventListener("input", (e) => {
    clearTimeout(container.__searchTimer);
    container.__searchTimer = setTimeout(reload, 250);
  });
  if (config.canInsert !== false) {
    document.getElementById("crud-new").onclick = () => openForm({ ...config, onSaved: reload });
  }

  await reload();
}
