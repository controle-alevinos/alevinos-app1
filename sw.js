// Service worker do app "Gestão de Alevinos".
// Objetivo: permitir "instalar" o app (ícone na tela inicial, tela cheia,
// sem barra do navegador) e abrir rápido mesmo com internet fraca no
// campo. NÃO armazena em cache nada relacionado ao Supabase (login e
// dados sempre precisam vir da rede, nunca de uma cópia antiga).
//
// Sempre que o app for alterado e publicado de novo, troque o número da
// versão abaixo (CACHE_VERSION) — isso força todo mundo a baixar os
// arquivos novos automaticamente na próxima abertura.
const CACHE_VERSION = "v1";
const CACHE_NAME = `alevinos-shell-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/app.js",
  "./js/auth.js",
  "./js/config.js",
  "./js/crud.js",
  "./js/router.js",
  "./js/supabaseClient.js",
  "./js/utils.js",
  "./js/modules/alimentacao.js",
  "./js/modules/clientes.js",
  "./js/modules/custosFixos.js",
  "./js/modules/dashboard.js",
  "./js/modules/despescas.js",
  "./js/modules/empresa.js",
  "./js/modules/fornecedores.js",
  "./js/modules/funcionarios.js",
  "./js/modules/mortalidades.js",
  "./js/modules/nutricao.js",
  "./js/modules/povoamento.js",
  "./js/modules/racoes.js",
  "./js/modules/relatorios.js",
  "./js/modules/shared.js",
  "./js/modules/tanques.js",
  "./js/modules/transferencias.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

function isAppOrigin(url) {
  return url.origin === self.location.origin;
}

// Nunca intercepta chamadas ao Supabase (autenticação e dados precisam
// ser sempre em tempo real) nem bibliotecas de terceiros (CDN).
function shouldBypass(url) {
  if (!isAppOrigin(url)) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // nunca cachear POST/PUT/DELETE
  const url = new URL(req.url);
  if (shouldBypass(url)) return; // deixa passar direto pra rede (Supabase, CDN)

  // App shell (HTML/CSS/JS/ícones do próprio app): cache-first, com
  // atualização em segundo plano (stale-while-revalidate) para pegar
  // versões novas sem travar a abertura do app.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
