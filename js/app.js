import { initAuth, login, signup, logout, state, isAdmin } from "./auth.js";
import { MENU, findRoute, firstAvailableRoute } from "./router.js";
import { toast } from "./utils.js";
import { registerServiceWorker, setupInstallButton } from "./pwa.js";

registerServiceWorker();
setupInstallButton(document.getElementById("btn-install"));

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");
const signupInfo = document.getElementById("signup-info");

document.getElementById("btn-show-signup").onclick = () => {
  loginForm.hidden = true; document.getElementById("btn-show-signup").hidden = true; signupForm.hidden = false;
};
document.getElementById("btn-show-login").onclick = () => {
  signupForm.hidden = true; loginForm.hidden = false; document.getElementById("btn-show-signup").hidden = false;
};

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const func = await login(email, password);
    if (!func) {
      loginError.textContent = "Login efetuado, mas seu usuário ainda não tem acesso liberado. Peça a um administrador para cadastrar seu e-mail na tela de Funcionários.";
      loginError.hidden = false;
      return;
    }
    boot();
  } catch (err) {
    loginError.textContent = "Não foi possível entrar: " + err.message;
    loginError.hidden = false;
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupError.hidden = true; signupInfo.hidden = true;
  const nome = document.getElementById("signup-nome").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  try {
    const data = await signup(nome, email, password);
    if (state.funcionario) {
      boot();
    } else if (!data.session) {
      signupInfo.textContent = "Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.";
      signupInfo.hidden = false;
    } else {
      signupInfo.textContent = "Conta criada. Se um administrador já preparou seu acesso com este e-mail, faça login normalmente. Caso contrário, peça para ele liberar seu acesso na tela de Funcionários.";
      signupInfo.hidden = false;
    }
  } catch (err) {
    signupError.textContent = "Não foi possível criar a conta: " + err.message;
    signupError.hidden = false;
  }
});

document.getElementById("btn-logout").onclick = async () => {
  await logout();
  location.hash = "";
  showLogin();
};

document.getElementById("btn-toggle-sidebar").onclick = () => {
  document.getElementById("sidebar").classList.toggle("open");
};

function showLogin() {
  appShell.hidden = true;
  loginScreen.hidden = false;
}

function buildMenu() {
  const nav = document.getElementById("menu");
  const admin = isAdmin();
  nav.innerHTML = MENU.map((g) => {
    const items = g.items.filter((i) => admin || !i.adminOnly);
    if (!items.length) return "";
    return `<div class="menu-group">${g.group}</div>${items.map((i) => `<a href="#${i.key}" data-key="${i.key}">${i.icon} ${i.label}</a>`).join("")}`;
  }).join("");
  document.getElementById("sidebar-user").textContent = `${state.funcionario.nome} · ${admin ? "Administrador" : "Operador"}`;
}

async function renderRoute() {
  const key = location.hash.replace("#", "") || firstAvailableRoute(isAdmin());
  const route = findRoute(key);
  const admin = isAdmin();
  if (!route || (route.adminOnly && !admin)) {
    location.hash = firstAvailableRoute(admin);
    return;
  }
  document.querySelectorAll("#menu a").forEach((a) => a.classList.toggle("active", a.dataset.key === key));
  document.getElementById("page-title").textContent = route.label;
  document.getElementById("sidebar").classList.remove("open");
  const content = document.getElementById("content");
  content.innerHTML = `<div class="loading">Carregando...</div>`;
  try {
    await route.mod.render(content);
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="card">Erro ao carregar esta tela: ${err.message}</div>`;
  }
}

async function boot() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  buildMenu();
  window.addEventListener("hashchange", renderRoute);
  await renderRoute();
}

(async function start() {
  await initAuth();
  if (state.session && state.funcionario) {
    boot();
  } else if (state.session && !state.funcionario) {
    showLogin();
    loginError.textContent = "Seu login existe, mas ainda não está vinculado a um funcionário ativo. Peça a um administrador para te cadastrar em Funcionários com este mesmo e-mail.";
    loginError.hidden = false;
  } else {
    showLogin();
  }
})();
