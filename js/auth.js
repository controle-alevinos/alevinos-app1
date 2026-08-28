import { supabase } from "./supabaseClient.js";
import { toast } from "./utils.js";

// Estado de sessão em memória
export const state = {
  session: null,
  user: null,
  funcionario: null, // { id, nome, papel, ... }
};

export function isAdmin() {
  return state.funcionario?.papel === "admin";
}
export function isLogged() {
  return !!state.session && !!state.funcionario;
}

// Tenta encontrar/():vincular o registro de funcionário do usuário logado.
// 1) já existe funcionarios.user_id = meu uid -> usa ele
// 2) existe um funcionarios pré-cadastrado com meu e-mail e user_id nulo -> vincula
// 3) não existe nenhum admin no sistema ainda -> eu me torno o admin (bootstrap)
// 4) nada disso -> sem acesso liberado ainda
export async function resolveFuncionario() {
  const email = state.user?.email;
  const uid = state.user?.id;
  if (!uid) return null;

  let { data: existing } = await supabase.from("funcionarios").select("*").eq("user_id", uid).maybeSingle();
  if (existing) return existing;

  const { data: preCadastrado } = await supabase
    .from("funcionarios").select("*").is("user_id", null).eq("email", email).maybeSingle();
  if (preCadastrado) {
    const { data: linked, error } = await supabase
      .from("funcionarios").update({ user_id: uid }).eq("id", preCadastrado.id).select().single();
    if (!error) return linked;
  }

  const { count } = await supabase.from("funcionarios").select("id", { count: "exact", head: true }).eq("papel", "admin");
  if (!count || count === 0) {
    const { data: created, error } = await supabase
      .from("funcionarios")
      .insert({ user_id: uid, email, nome: state.user.user_metadata?.nome || email, cargo: "Administrador", papel: "admin", ativo: true })
      .select().single();
    if (!error) return created;
  }

  return null;
}

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  state.user = data.session?.user || null;
  if (state.user) {
    state.funcionario = await resolveFuncionario();
  }
  return state;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  state.session = data.session;
  state.user = data.user;
  state.funcionario = await resolveFuncionario();
  return state.funcionario;
}

export async function signup(nome, email, password) {
  // emailRedirectTo é essencial: sem isso, o Supabase usa a "Site URL"
  // configurada no painel (por padrão http://localhost:3000) no link de
  // confirmação por e-mail — o que quebra a confirmação em produção. Ao
  // apontar explicitamente para a origem atual (o link real que a pessoa
  // está usando), o link do e-mail sempre volta para o lugar certo, seja
  // o app publicado no Render ou um teste local.
  // IMPORTANTE: essa URL também precisa estar na lista "Redirect URLs" do
  // Supabase (Authentication -> URL Configuration), senão o Supabase
  // ignora este valor e volta a usar a Site URL padrão mesmo assim.
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { nome }, emailRedirectTo: window.location.origin + "/" },
  });
  if (error) throw error;
  if (data.session) {
    state.session = data.session;
    state.user = data.user;
    state.funcionario = await resolveFuncionario();
  }
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  state.session = null; state.user = null; state.funcionario = null;
}

export function requireAdmin() {
  if (!isAdmin()) {
    toast("Apenas administradores podem fazer isso.", "err");
    return false;
  }
  return true;
}
