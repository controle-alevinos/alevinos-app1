import * as dashboard from "./modules/dashboard.js";
import * as empresa from "./modules/empresa.js";
import * as clientes from "./modules/clientes.js";
import * as tanques from "./modules/tanques.js";
import * as fornecedores from "./modules/fornecedores.js";
import * as povoamento from "./modules/povoamento.js";
import * as racoes from "./modules/racoes.js";
import * as nutricao from "./modules/nutricao.js";
import * as alimentacao from "./modules/alimentacao.js";
import * as mortalidades from "./modules/mortalidades.js";
import * as transferencias from "./modules/transferencias.js";
import * as despescas from "./modules/despescas.js";
import * as relatorios from "./modules/relatorios.js";
import * as custosFixos from "./modules/custosFixos.js";
import * as funcionarios from "./modules/funcionarios.js";

export const MENU = [
  {
    group: "Visão geral",
    items: [{ key: "dashboard", label: "Dashboard", icon: "📊", mod: dashboard, adminOnly: false }],
  },
  {
    group: "Operação diária",
    items: [
      { key: "povoamento", label: "Povoamento (Aba 5)", icon: "🐟", mod: povoamento, adminOnly: false },
      { key: "alimentacao", label: "Alimentação (Aba 8)", icon: "🍽️", mod: alimentacao, adminOnly: false },
      { key: "mortalidades", label: "Mortalidades (Aba 9)", icon: "⚠️", mod: mortalidades, adminOnly: false },
      { key: "transferencias", label: "Transferência (Aba 10)", icon: "🔄", mod: transferencias, adminOnly: false },
      { key: "despescas", label: "Despesca (Aba 11)", icon: "🎣", mod: despescas, adminOnly: false },
    ],
  },
  {
    group: "Referência",
    items: [{ key: "nutricao", label: "Tabela de Nutrição (Aba 7)", icon: "📈", mod: nutricao, adminOnly: false }],
  },
  {
    group: "Cadastros",
    items: [
      { key: "empresa", label: "Empresa (Aba 1)", icon: "🏢", mod: empresa, adminOnly: true },
      { key: "clientes", label: "Clientes (Aba 2)", icon: "🧑‍💼", mod: clientes, adminOnly: true },
      { key: "tanques", label: "Tanques (Aba 3)", icon: "🌊", mod: tanques, adminOnly: true },
      { key: "fornecedores", label: "Fornecedores (Aba 4)", icon: "🚚", mod: fornecedores, adminOnly: true },
      { key: "racoes", label: "Rações (Aba 6)", icon: "🌾", mod: racoes, adminOnly: true },
      { key: "funcionarios", label: "Funcionários (Aba 14)", icon: "👥", mod: funcionarios, adminOnly: true },
    ],
  },
  {
    group: "Gestão",
    items: [
      { key: "relatorios", label: "Relatórios (Aba 12)", icon: "📑", mod: relatorios, adminOnly: false },
      { key: "custos", label: "Manutenção e Custos (Aba 13)", icon: "🛠️", mod: custosFixos, adminOnly: true },
    ],
  },
];

export function findRoute(key) {
  for (const g of MENU) {
    const it = g.items.find((i) => i.key === key);
    if (it) return it;
  }
  return null;
}

export function firstAvailableRoute(isAdmin) {
  for (const g of MENU) {
    const it = g.items.find((i) => isAdmin || !i.adminOnly);
    if (it) return it.key;
  }
  return "dashboard";
}
