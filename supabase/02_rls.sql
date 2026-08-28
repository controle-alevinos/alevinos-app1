-- =====================================================================
-- RLS (Row Level Security) — controle de acesso por papel
--   admin    -> acesso total
--   operador -> lê cadastros/referências e LANÇA dados operacionais
--               (povoamento, alimentação, mortalidade, transferência,
--               despesca), mas não edita/apaga histórico nem vê
--               empresa/funcionários/custos fixos (financeiro/RH)
-- Rodar depois de 01_schema.sql
-- =====================================================================

alter table public.funcionarios      enable row level security;
alter table public.empresa           enable row level security;
alter table public.clientes          enable row level security;
alter table public.fornecedores      enable row level security;
alter table public.tanques           enable row level security;
alter table public.lotes             enable row level security;
alter table public.racoes            enable row level security;
alter table public.tabela_nutricao   enable row level security;
alter table public.povoamento        enable row level security;
alter table public.mortalidades      enable row level security;
alter table public.transferencias    enable row level security;
alter table public.despescas         enable row level security;
alter table public.alimentacao       enable row level security;
alter table public.custos_fixos      enable row level security;

-- ---------- FUNCIONÁRIOS: cada um vê o próprio registro; admin vê tudo ----------
-- (inclui também o registro pré-cadastrado pelo admin com o mesmo e-mail,
-- ainda sem user_id, para permitir o auto-vínculo no primeiro login)
drop policy if exists p_funcionarios_select on public.funcionarios;
create policy p_funcionarios_select on public.funcionarios for select
  using (
    public.sou_admin()
    or user_id = auth.uid()
    or (user_id is null and email is not null and email = (auth.jwt() ->> 'email'))
  );
drop policy if exists p_funcionarios_admin_all on public.funcionarios;
create policy p_funcionarios_admin_all on public.funcionarios for all
  using (public.sou_admin()) with check (public.sou_admin());

-- Bootstrap: o primeiro usuário do sistema (nenhum admin cadastrado ainda)
-- pode criar o próprio registro como admin.
drop policy if exists p_funcionarios_self_bootstrap on public.funcionarios;
create policy p_funcionarios_self_bootstrap on public.funcionarios for insert
  with check (
    user_id = auth.uid()
    and papel = 'admin'
    and not public.existe_admin()
  );

-- Auto-vínculo: um funcionário pré-cadastrado pelo admin (com e-mail, sem
-- user_id) pode vincular sua própria conta na primeira vez que faz login
-- com o mesmo e-mail.
drop policy if exists p_funcionarios_self_link on public.funcionarios;
create policy p_funcionarios_self_link on public.funcionarios for update
  using (user_id is null and email is not null and email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid());

-- ---------- EMPRESA: só admin ----------
drop policy if exists p_empresa_admin_all on public.empresa;
create policy p_empresa_admin_all on public.empresa for all
  using (public.sou_admin()) with check (public.sou_admin());
drop policy if exists p_empresa_select on public.empresa;
create policy p_empresa_select on public.empresa for select
  using (public.tenho_login());

-- ---------- CUSTOS FIXOS: só admin ----------
drop policy if exists p_custos_admin_all on public.custos_fixos;
create policy p_custos_admin_all on public.custos_fixos for all
  using (public.sou_admin()) with check (public.sou_admin());

-- ---------- CLIENTES / FORNECEDORES: leitura para todo mundo logado, escrita só admin ----------
drop policy if exists p_clientes_select on public.clientes;
create policy p_clientes_select on public.clientes for select using (public.tenho_login());
drop policy if exists p_clientes_admin_write on public.clientes;
create policy p_clientes_admin_write on public.clientes for insert with check (public.sou_admin());
drop policy if exists p_clientes_admin_update on public.clientes;
create policy p_clientes_admin_update on public.clientes for update using (public.sou_admin());
drop policy if exists p_clientes_admin_delete on public.clientes;
create policy p_clientes_admin_delete on public.clientes for delete using (public.sou_admin());

drop policy if exists p_fornecedores_select on public.fornecedores;
create policy p_fornecedores_select on public.fornecedores for select using (public.tenho_login());
drop policy if exists p_fornecedores_admin_write on public.fornecedores;
create policy p_fornecedores_admin_write on public.fornecedores for insert with check (public.sou_admin());
drop policy if exists p_fornecedores_admin_update on public.fornecedores;
create policy p_fornecedores_admin_update on public.fornecedores for update using (public.sou_admin());
drop policy if exists p_fornecedores_admin_delete on public.fornecedores;
create policy p_fornecedores_admin_delete on public.fornecedores for delete using (public.sou_admin());

-- ---------- TANQUES: leitura geral, escrita só admin ----------
drop policy if exists p_tanques_select on public.tanques;
create policy p_tanques_select on public.tanques for select using (public.tenho_login());
drop policy if exists p_tanques_admin_write on public.tanques;
create policy p_tanques_admin_write on public.tanques for insert with check (public.sou_admin());
drop policy if exists p_tanques_admin_update on public.tanques;
create policy p_tanques_admin_update on public.tanques for update using (public.sou_admin());
drop policy if exists p_tanques_admin_delete on public.tanques;
create policy p_tanques_admin_delete on public.tanques for delete using (public.sou_admin());

-- ---------- LOTES: leitura geral; escrita via triggers (security definer não é necessário
--            pois os triggers rodam como o próprio usuário) -> liberar insert/update para logados ----------
drop policy if exists p_lotes_select on public.lotes;
create policy p_lotes_select on public.lotes for select using (public.tenho_login());
drop policy if exists p_lotes_write on public.lotes;
create policy p_lotes_write on public.lotes for insert with check (public.tenho_login());
drop policy if exists p_lotes_update on public.lotes;
create policy p_lotes_update on public.lotes for update using (public.tenho_login());

-- ---------- RAÇÕES: leitura geral, escrita só admin ----------
drop policy if exists p_racoes_select on public.racoes;
create policy p_racoes_select on public.racoes for select using (public.tenho_login());
drop policy if exists p_racoes_admin_write on public.racoes;
create policy p_racoes_admin_write on public.racoes for insert with check (public.sou_admin());
drop policy if exists p_racoes_admin_update on public.racoes;
create policy p_racoes_admin_update on public.racoes for update using (public.sou_admin());
drop policy if exists p_racoes_admin_delete on public.racoes;
create policy p_racoes_admin_delete on public.racoes for delete using (public.sou_admin());

-- ---------- TABELA DE NUTRIÇÃO: leitura geral, escrita só admin ----------
drop policy if exists p_nutricao_select on public.tabela_nutricao;
create policy p_nutricao_select on public.tabela_nutricao for select using (public.tenho_login());
drop policy if exists p_nutricao_admin_all on public.tabela_nutricao;
create policy p_nutricao_admin_all on public.tabela_nutricao for all
  using (public.sou_admin()) with check (public.sou_admin());

-- ---------- LANÇAMENTOS OPERACIONAIS: todo logado lê e insere; só admin edita/apaga ----------
do $$
declare tbl text;
begin
  foreach tbl in array array['povoamento','mortalidades','transferencias','despescas','alimentacao'] loop
    execute format('drop policy if exists p_%1$s_select on public.%1$s', tbl);
    execute format('create policy p_%1$s_select on public.%1$s for select using (public.tenho_login())', tbl);
    execute format('drop policy if exists p_%1$s_insert on public.%1$s', tbl);
    execute format('create policy p_%1$s_insert on public.%1$s for insert with check (public.tenho_login())', tbl);
    execute format('drop policy if exists p_%1$s_admin_update on public.%1$s', tbl);
    execute format('create policy p_%1$s_admin_update on public.%1$s for update using (public.sou_admin())', tbl);
    execute format('drop policy if exists p_%1$s_admin_delete on public.%1$s', tbl);
    execute format('create policy p_%1$s_admin_delete on public.%1$s for delete using (public.sou_admin())', tbl);
  end loop;
end $$;

-- =====================================================================
-- FIM DAS POLÍTICAS DE RLS
-- =====================================================================
