# Sistema de Gestão de Criação de Alevinos

App web (HTML/JS puro + Supabase) para gestão completa de uma piscicultura:
cadastros, povoamento, alimentação com sugestão automática de trato,
mortalidade, transferência, despesca, relatórios com gráficos e dashboard
com CV/CA e previsão de custo do peixe.

## 1. Estrutura do projeto

```
alevinos-app/
  index.html            App inteiro (login + shell)
  manifest.webmanifest  metadados do PWA (nome, ícone, cor) — ver seção 8
  sw.js                 service worker do PWA (cache do app, nunca do Supabase)
  icons/                ícones do app instalado (192/512/maskable/apple)
  css/style.css
  js/
    config.js            <- COLOQUE AQUI a URL e a chave anon do seu projeto Supabase
    supabaseClient.js
    auth.js               lógica de login/cadastro/vínculo de funcionário
    crud.js               motor genérico de listagem/formulário usado pelas abas
    router.js              menu + rotas das 14 abas
    app.js                 bootstrap do app
    pwa.js                  registro do service worker + botão "Instalar app"
    utils.js                formatação, máscaras, filtros de período
    modules/                 uma tela por aba (empresa, clientes, tanques, ...)
  supabase/
    01_schema.sql          tabelas, triggers, funções, views (rode primeiro)
    02_rls.sql              políticas de segurança por perfil (rode depois)
    03_seed_nutricao.sql    tabela de nutrição (Aba 7), importada do seu xlsx
    04_seed_tanques.sql     pré-cadastro dos 26 tanques
    05_bootstrap_admin.sql  script de apoio (só é necessário se o botão
                            "Criar conta de administrador" do app não estiver
                            disponível por algum motivo)
    06_hardening.sql        correções do Security Advisor (search_path fixo
                            nas funções + revogação de EXECUTE de "anon" nas
                            funções auxiliares de permissão)
```

## 2. Publicar o banco (Supabase)

1. Crie um projeto em supabase.com (grátis) ou use um projeto existente.
2. No SQL Editor do projeto, rode os arquivos **nesta ordem**:
   `01_schema.sql` → `02_rls.sql` → `03_seed_nutricao.sql` → `04_seed_tanques.sql`
   → `06_hardening.sql`.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon/public**.
4. Cole os dois valores em `js/config.js`.
5. (Recomendado) Em **Authentication → Providers → Email**, desative a
   confirmação por e-mail se quiser que o primeiro admin entre imediatamente
   após criar a conta (sem precisar clicar num link de confirmação).

## 3. Primeiro acesso (virar administrador)

1. Abra o app e clique em **"Primeiro acesso? Criar conta de administrador"**.
2. Preencha nome, e-mail e senha e envie.
3. Como ainda não existe nenhum administrador cadastrado, o próprio sistema
   te reconhece como o primeiro admin automaticamente (regra de segurança
   em `02_rls.sql`, política `p_funcionarios_self_bootstrap`).
4. Se por algum motivo isso não acontecer (ex.: confirmação de e-mail
   pendente), use `05_bootstrap_admin.sql` no SQL Editor do Supabase.

## 4. Cadastrando outros funcionários (operadores)

Como admin, vá em **Funcionários** e cadastre nome, e-mail e o perfil
(`Operador` para quem só faz lançamentos do dia a dia, `Administrador` para
quem também mexe em cadastros/financeiro). Avise a pessoa para acessar o
app e usar **"Criar conta"** com o **mesmo e-mail** que você cadastrou — o
sistema vincula o login automaticamente ao registro que você criou,
herdando o perfil de acesso que você escolheu. Ninguém entra sem que um
admin tenha cadastrado o e-mail antes.

## 5. Site publicado (URL de acesso)

O app já está publicado no Render como Static Site, a partir deste
repositório GitHub:

**🔗 https://alevinos-app1.onrender.com**

Esse é o link que você compartilha com a equipe — é o mesmo link usado no
passo a passo de instalação (seção 8) e é o endereço a usar em qualquer
navegador (celular ou computador).

Detalhes técnicos do deploy (só relevante se for mexer nisso de novo):
- Serviço Render: `alevinos-app1` (workspace "My Workspace")
- Repositório: `https://github.com/controle-alevinos/alevinos-app1`, branch `main`
- Publish directory: `./` (raiz do repositório — os arquivos do app ficam
  soltos direto na raiz, sem subpasta)
- Deploy automático: toda vez que você enviar uma alteração para a branch
  `main` no GitHub, o Render republica sozinho em 1-2 minutos.
- O app é só HTML/JS/CSS estático, então também funcionaria em qualquer
  outro host estático (Vercel, Netlify, GitHub Pages, Cloudflare Pages) se
  um dia quiser migrar.

## 6. Como funciona a automação entre as abas

- Cada vez que um **povoamento** é lançado num tanque sem lote ativo, o
  sistema cria automaticamente um **lote** (código tipo `L01-20260115-1`) e
  atualiza o campo "lote atual" do tanque.
- **Mortalidade**, **despesca** e **transferência** sempre debitam do
  estoque calculado daquele lote (não alteram o povoamento original — o
  histórico fica preservado, mas o saldo em tempo real é sempre correto).
- Quando o estoque de um lote chega a zero (por despesca ou transferência
  total), o lote é encerrado automaticamente e o tanque fica livre para um
  novo povoamento.
- Em **Alimentação**, ao escolher um tanque o sistema calcula o peso médio
  estimado do lote (a partir da curva de nutrição — Aba 7) e sugere a taxa
  de alimentação, a ração recomendada, o pellet e a quantidade do dia. Você
  pode aceitar a sugestão ou ajustar manualmente.
- O **Dashboard** consolida CA (conversão alimentar) e custo do peixe a
  partir dos lançamentos reais de ração e do estoque/peso atual de cada
  lote ativo, e projeta o custo para os pesos-alvo (15g, 20g, 25g... ou
  qualquer peso digitado) usando a mesma curva de nutrição.

## 7. Perfis de acesso

- **Administrador**: acesso total (todos os cadastros, financeiro,
  funcionários, exclusão de lançamentos).
- **Operador**: lança povoamento, alimentação, mortalidade, transferência e
  despesca; consulta tanques, rações, nutrição, relatórios e dashboard; não
  vê nem edita empresa, custos fixos ou dados de outros funcionários, e não
  pode editar/excluir lançamentos já salvos (evita alterar histórico —
  peça a um admin caso precise corrigir algo).

## 8. Instalar o app na equipe (como um app de loja)

O app já é um **PWA** (Progressive Web App): tem manifesto + ícone + um
"service worker" próprio (`manifest.webmanifest`, `icons/`, `sw.js`,
carregados automaticamente pelo `index.html`/`js/pwa.js`). Isso quer dizer
que, depois de publicado, qualquer pessoa da equipe pode "instalar" o app
a partir do link — sem Play Store, sem loja de app nenhuma — e ele passa a
abrir em tela cheia, com ícone próprio, exatamente como um app comum do
celular.

**Envie para a equipe apenas isto:** o link **https://alevinos-app1.onrender.com**
e o passo a passo abaixo de acordo com o aparelho de cada um.

### Celular Android (Chrome)
1. Abra o link recebido no Chrome.
2. Toque nos três pontinhos (⋮) no canto superior direito **ou** toque no
   botão amarelo **"⬇️ Instalar app"** que aparece no menu lateral do
   sistema.
3. Toque em **"Instalar app"** / **"Adicionar à tela inicial"**.
4. Confirme. O ícone 🐟 aparece na tela inicial do celular, igual a
   qualquer outro app — abre em tela cheia, sem barra de endereço.

### iPhone/iPad (Safari)
No iOS, apps instaláveis só funcionam pelo **Safari** (não pelo Chrome do
iPhone, por limitação da Apple):
1. Abra o link recebido no Safari.
2. Toque no ícone de **compartilhar** (o quadrado com uma seta para cima).
3. Role e toque em **"Adicionar à Tela de Início"**.
4. Toque em **"Adicionar"**. O ícone aparece na tela inicial.

### Computador (Windows/Mac/Linux) — Chrome ou Edge
1. Abra o link recebido.
2. Clique no ícone de instalação que aparece do lado direito da barra de
   endereço (um monitor com uma seta), ou no botão **"⬇️ Instalar app"**
   no menu lateral.
3. Clique em **"Instalar"**. O app abre numa janela própria (sem abas do
   navegador) e fica disponível no menu Iniciar / Launchpad, como um
   programa instalado.

### Depois de instalado
- Cada pessoa continua tendo o **próprio login** (Administrador cadastra
  o e-mail em Funcionários — veja seção 4 — e a pessoa cria a conta com
  esse mesmo e-mail, uma única vez).
- O app busca os dados sempre em tempo real do Supabase; a parte
  "instalável" só acelera a abertura e dá a aparência de app nativo — não
  funciona sem internet (fila offline está listada como melhoria futura
  na seção 9).
- Se o app for atualizado (nova versão publicada), o ícone instalado
  continua funcionando e passa a carregar a versão nova sozinho da
  próxima vez que for aberto com internet.

## 9. Melhorias sugeridas (não implementadas ainda)

Analisando o conjunto das 14 abas, estas são as melhorias que mais
agregariam, em ordem de impacto:

1. **Preço de compra dos alevinos no Povoamento.** Hoje o custo do peixe no
   Dashboard considera só a ração. Adicionar um campo de preço/alevino em
   Povoamento tornaria o custo do peixe (Dashboard) completo, incluindo a
   aquisição.
2. **Biometrias periódicas (não só na despesca).** Hoje o peso do lote é
   estimado pela curva de nutrição; um registro de pesagem manual periódica
   (ex.: semanal, amostragem de alguns peixes) deixaria a estimativa de
   peso e a sugestão de trato muito mais precisas que a curva teórica.
3. **Rateio de custos fixos por lote/kg.** A Aba 13 (manutenção/custos
   fixos) hoje é só um livro-caixa; ratear esses valores pelos lotes ativos
   (por tempo ou por biomassa) daria um custo do peixe "completo" (ração +
   fixos + mão de obra), não só o custo de ração.
4. **Alertas automáticos**: estoque baixo de ração, tanque sem trato há
   mais de X horas, mortalidade acima da média do lote, tanque perto da
   capacidade de biomassa cadastrada.
5. **Anexos/fotos** nos lançamentos de mortalidade e despesca (evidência
   para o produtor e para o comprador).
6. **Exportação de relatórios em PDF/CSV** — hoje eles só existem na tela.
7. ~~**App instalável (PWA)**~~ — **já implementado** (seção 9). Falta só a
   parte de **fila offline** (lançar dados a campo sem sinal e sincronizar
   depois) — muito comum em pisciculturas com conectividade ruim nos
   tanques; isso ainda pode ser adicionado numa próxima rodada.
8. **Permissão por tanque** (um operador só lança nos tanques do seu
   turno/setor), útil em operações maiores com equipes por área.
9. **Múltiplas empresas** — hoje o sistema assume uma piscicultura; se você
   opera mais de uma unidade, dá para adicionar `empresa_id` nas tabelas
   principais e filtrar por unidade.

Se quiser, posso implementar qualquer uma dessas em uma próxima rodada.
