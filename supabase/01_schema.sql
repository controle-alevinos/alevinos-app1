-- =====================================================================
-- SISTEMA DE GESTÃO DE CRIAÇÃO DE ALEVINOS — SCHEMA COMPLETO
-- Rodar no SQL Editor do Supabase, na ordem: 01_schema.sql -> 02_rls.sql
--   -> seed_nutricao.sql -> seed_tanques.sql
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TIPOS
-- ---------------------------------------------------------------------
do $$ begin
  create type public.uf_type as enum ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.condicao_peixe as enum ('regular','bom','ótimo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_peixe as enum ('tilápia','surubim','tambaqui','pacu','pirarucu','outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.papel_usuario as enum ('admin','operador');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_lote as enum ('ativo','encerrado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- FUNCIONÁRIOS (Aba 14) — também guarda o papel de acesso de cada login
-- ---------------------------------------------------------------------
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text,                              -- usado para vincular o login (self-service) ao registro criado pelo admin
  nome text not null,
  cargo text,
  papel public.papel_usuario not null default 'operador',
  telefone text,
  salario numeric(12,2),
  valor_diaria numeric(12,2),
  data_admissao date,
  data_demissao date,
  extras numeric(12,2) default 0,
  descricao_extras text,
  outros text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.funcionarios is 'Aba 14 — Relação de empregados. user_id liga ao login (auth.users) para controle de acesso.';

-- helpers de autorização (security definer p/ evitar recursão de RLS)
create or replace function public.meu_papel()
returns public.papel_usuario
language sql stable security definer set search_path = public as $$
  select papel from public.funcionarios where user_id = auth.uid() limit 1;
$$;

create or replace function public.sou_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.funcionarios where user_id = auth.uid() limit 1), false);
$$;

create or replace function public.tenho_login()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.funcionarios where user_id = auth.uid() and ativo = true);
$$;

-- usada só pela policy de bootstrap (precisa enxergar TODA a tabela, não
-- apenas o que a RLS deixaria o usuário atual ver, senão um usuário sem
-- acesso nunca "veria" o admin existente e o bootstrap ficaria sempre liberado)
create or replace function public.existe_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.funcionarios where papel = 'admin');
$$;

-- ---------------------------------------------------------------------
-- CADASTROS DE ENDEREÇO/CONTATO (Aba 1: empresa | Aba 2: clientes | Aba 4: fornecedores)
-- ---------------------------------------------------------------------
create table if not exists public.empresa (
  id uuid primary key default gen_random_uuid(),
  nome_empresa text not null,
  cnpj_cpf text,
  ie text,
  rua text,
  bairro text,
  cidade text,
  uf public.uf_type,
  cep text,
  telefone text,
  referencia text,
  condicoes_pagamento text,
  referencias_comerciais text,
  referencias_bancarias text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.empresa is 'Aba 1 — Cadastro da empresa (normalmente 1 registro).';

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  cnpj_cpf text,
  ie text,
  rua text,
  bairro text,
  cidade text,
  uf public.uf_type,
  cep text,
  telefone text,
  referencia text,
  condicoes_pagamento text,
  referencias_comerciais text,
  referencias_bancarias text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.clientes is 'Aba 2 — Cadastro de clientes.';

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome_empresa text not null,
  cnpj_cpf text,
  ie text,
  rua text,
  bairro text,
  cidade text,
  uf public.uf_type,
  cep text,
  telefone text,
  referencia text,
  condicoes_pagamento text,
  referencias_comerciais text,
  referencias_bancarias text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.fornecedores is 'Aba 4 — Cadastro de fornecedores.';

-- ---------------------------------------------------------------------
-- TANQUES (Aba 3) — 26 unidades
-- ---------------------------------------------------------------------
create table if not exists public.tanques (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  nome text,
  lote_atual text,                       -- sincronizado automaticamente (ver lotes)
  largura_m numeric(10,2),
  comprimento_m numeric(10,2),
  profundidade_m numeric(10,2),
  lamina_agua_m2 numeric(12,2) generated always as (
    round((coalesce(largura_m,0) * coalesce(comprimento_m,0))::numeric, 2)
  ) stored,
  volume_m3 numeric(12,2) generated always as (
    round((coalesce(largura_m,0) * coalesce(comprimento_m,0) * coalesce(profundidade_m,0))::numeric, 2)
  ) stored,
  capacidade_biomassa_kg numeric(12,2),
  capacidade_alevinos int,
  tem_estufa boolean not null default false,
  tem_rede_anti_passaros boolean not null default false,
  tem_aeradores_pas boolean not null default false,
  qtd_aeradores_pas int not null default 0,
  tem_aeradores_chafariz boolean not null default false,
  qtd_aeradores_chafariz int not null default 0,
  tem_alimentador_automatico boolean not null default false,
  qtd_alimentador_automatico int not null default 0,
  tem_automacao boolean not null default false,
  tem_cftv boolean not null default false,
  tem_lixeira boolean not null default false,
  tem_portao boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tanques is 'Aba 3 — Cadastro dos 26 tanques. lote_atual é atualizado automaticamente pelo módulo de Lotes.';

-- ---------------------------------------------------------------------
-- LOTES — melhoria sugerida: cada ciclo de povoamento->despesca de um
-- tanque vira um "lote" rastreável, ligando povoamento/mortalidade/
-- transferência/despesca automaticamente (ver README, item "Melhorias").
-- ---------------------------------------------------------------------
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tanque_id uuid not null references public.tanques(id),
  tipo_peixe public.tipo_peixe,
  data_abertura date not null default current_date,
  data_encerramento date,
  status public.status_lote not null default 'ativo',
  created_at timestamptz not null default now()
);
create unique index if not exists uq_lote_ativo_por_tanque
  on public.lotes(tanque_id) where (status = 'ativo');

create or replace function public.fn_gerar_codigo_lote(p_tanque_id uuid)
returns text language plpgsql as $$
declare
  v_numero int;
  v_seq int;
  v_codigo text;
begin
  select numero into v_numero from public.tanques where id = p_tanque_id;
  select count(*) + 1 into v_seq from public.lotes where tanque_id = p_tanque_id;
  v_codigo := 'L' || lpad(v_numero::text, 2, '0') || '-' || to_char(current_date, 'YYYYMMDD') || '-' || v_seq;
  return v_codigo;
end;
$$;

create or replace function public.fn_lote_ativo(p_tanque_id uuid)
returns uuid language sql stable as $$
  select id from public.lotes where tanque_id = p_tanque_id and status = 'ativo' limit 1;
$$;

-- security definer: qualquer usuário logado pode disparar isto (via insert em
-- povoamento/transferência/despesca), mas a UPDATE em tanques por si só é
-- restrita a admin (ver 02_rls.sql) — a função roda com privilégio elevado
-- só para sincronizar esta única coluna.
create or replace function public.fn_sync_tanque_lote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.tanques
    set lote_atual = case when NEW.status = 'ativo' then NEW.codigo else null end
    where id = NEW.tanque_id;
  return NEW;
end;
$$;
drop trigger if exists trg_sync_tanque_lote on public.lotes;
create trigger trg_sync_tanque_lote after insert or update of status on public.lotes
  for each row execute function public.fn_sync_tanque_lote();

-- ---------------------------------------------------------------------
-- RAÇÕES (Aba 6)
-- ---------------------------------------------------------------------
create table if not exists public.racoes (
  id uuid primary key default gen_random_uuid(),
  nome_racao text not null,
  kg_por_saco numeric(10,2) not null default 25,
  unidade_fornecimento_kg numeric(10,2),
  preco_unitario_kg numeric(12,4) not null default 0,
  preco_saco numeric(12,2) generated always as (round((coalesce(preco_unitario_kg,0) * coalesce(kg_por_saco,0))::numeric,2)) stored,
  fornecedor_id uuid references public.fornecedores(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.racoes is 'Aba 6 — Cadastro de rações.';

-- ---------------------------------------------------------------------
-- TABELA DE NUTRIÇÃO — referência (Aba 7)
-- ---------------------------------------------------------------------
create table if not exists public.tabela_nutricao (
  id serial primary key,
  ordem int not null,
  fase text not null,
  semana int not null,
  dias int not null,
  peso_g numeric(10,3) not null,
  comprimento_cm text,
  ganho_semanal_g numeric(10,2),
  pb_percent numeric(6,2),
  taxa_alimentacao_pct numeric(6,2),
  racao_1000_peixes_kg_dia numeric(10,4),
  frequencia_dia text,
  ca_esperada text,
  pellet_mm text,
  produto_referencia text,
  sistema_recomendado text
);
comment on table public.tabela_nutricao is 'Aba 7 — Curva de crescimento/nutrição de referência (importada do xlsx enviado), usada para sugerir o próximo trato.';
create index if not exists idx_nutricao_dias on public.tabela_nutricao(dias);
create index if not exists idx_nutricao_peso on public.tabela_nutricao(peso_g);

-- interpola peso esperado (g) para X dias de cultivo, usando a curva de referência
create or replace function public.fn_peso_esperado_por_dias(p_dias numeric)
returns numeric language plpgsql stable as $$
declare
  r_inf record; r_sup record; v_peso numeric;
begin
  select dias, peso_g into r_inf from public.tabela_nutricao where dias <= p_dias order by dias desc limit 1;
  select dias, peso_g into r_sup from public.tabela_nutricao where dias >= p_dias order by dias asc limit 1;
  if r_inf is null then return (select peso_g from public.tabela_nutricao order by dias asc limit 1); end if;
  if r_sup is null then return (select peso_g from public.tabela_nutricao order by dias desc limit 1); end if;
  if r_inf.dias = r_sup.dias then return r_inf.peso_g; end if;
  v_peso := r_inf.peso_g + (r_sup.peso_g - r_inf.peso_g) * ((p_dias - r_inf.dias)::numeric / (r_sup.dias - r_inf.dias)::numeric);
  return round(v_peso, 2);
end;
$$;

-- acha o "dia da curva" mais próximo de um peso conhecido (para recalibrar a partir de biometrias reais)
create or replace function public.fn_dias_por_peso(p_peso numeric)
returns numeric language plpgsql stable as $$
declare
  r_inf record; r_sup record; v_dias numeric;
begin
  select dias, peso_g into r_inf from public.tabela_nutricao where peso_g <= p_peso order by peso_g desc limit 1;
  select dias, peso_g into r_sup from public.tabela_nutricao where peso_g >= p_peso order by peso_g asc limit 1;
  if r_inf is null then return (select dias from public.tabela_nutricao order by peso_g asc limit 1); end if;
  if r_sup is null then return (select dias from public.tabela_nutricao order by peso_g desc limit 1); end if;
  if r_inf.peso_g = r_sup.peso_g then return r_inf.dias; end if;
  v_dias := r_inf.dias + (r_sup.dias - r_inf.dias) * ((p_peso - r_inf.peso_g) / (r_sup.peso_g - r_inf.peso_g));
  return round(v_dias, 1);
end;
$$;

-- linha da curva de nutrição mais próxima de um peso (taxa%, produto, pellet, frequência, CA esperada)
create or replace function public.fn_linha_nutricao_por_peso(p_peso numeric)
returns public.tabela_nutricao language sql stable as $$
  select * from public.tabela_nutricao
  order by abs(peso_g - p_peso) asc
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- POVOAMENTO (Aba 5)
-- ---------------------------------------------------------------------
create table if not exists public.povoamento (
  id uuid primary key default gen_random_uuid(),
  tanque_id uuid not null references public.tanques(id),
  lote_id uuid references public.lotes(id),
  data_recebimento date not null default current_date,
  tipo_peixe public.tipo_peixe not null,
  tamanho_peixe_g numeric(10,3) not null,
  quantidade int not null check (quantidade > 0),
  condicao public.condicao_peixe not null default 'bom',
  observacao text,
  fornecedor_id uuid references public.fornecedores(id),
  controle_fornecedor text, -- nº da NF e/ou pedido
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.povoamento is 'Aba 5 — Povoamento de peixes. Abre automaticamente um novo lote no tanque (ou usa o lote ativo existente).';

create or replace function public.fn_povoamento_before_insert() returns trigger
language plpgsql as $$
declare
  v_lote_id uuid;
  v_codigo text;
begin
  if NEW.lote_id is null then
    v_lote_id := public.fn_lote_ativo(NEW.tanque_id);
    if v_lote_id is null then
      v_codigo := public.fn_gerar_codigo_lote(NEW.tanque_id);
      insert into public.lotes (codigo, tanque_id, tipo_peixe, data_abertura, status)
        values (v_codigo, NEW.tanque_id, NEW.tipo_peixe, NEW.data_recebimento, 'ativo')
        returning id into v_lote_id;
    end if;
    NEW.lote_id := v_lote_id;
  end if;
  NEW.created_by := auth.uid();
  return NEW;
end;
$$;
drop trigger if exists trg_povoamento_before_insert on public.povoamento;
create trigger trg_povoamento_before_insert before insert on public.povoamento
  for each row execute function public.fn_povoamento_before_insert();

-- ---------------------------------------------------------------------
-- MORTALIDADES (Aba 9) — sensibiliza o estoque do lote/tanque
-- ---------------------------------------------------------------------
create table if not exists public.mortalidades (
  id uuid primary key default gen_random_uuid(),
  tanque_id uuid not null references public.tanques(id),
  lote_id uuid references public.lotes(id),
  data_referencia date not null default current_date,
  quantidade int not null check (quantidade > 0),
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.mortalidades is 'Aba 9 — Lançamento de mortalidades. Reduz automaticamente o estoque calculado do lote (view v_estoque_lote).';

create or replace function public.fn_mortalidade_before_insert() returns trigger
language plpgsql as $$
begin
  if NEW.lote_id is null then
    NEW.lote_id := public.fn_lote_ativo(NEW.tanque_id);
  end if;
  NEW.created_by := auth.uid();
  return NEW;
end;
$$;
drop trigger if exists trg_mortalidade_before_insert on public.mortalidades;
create trigger trg_mortalidade_before_insert before insert on public.mortalidades
  for each row execute function public.fn_mortalidade_before_insert();

-- ---------------------------------------------------------------------
-- TRANSFERÊNCIA (Aba 10) — sai do lote de origem, entra no lote de destino
-- ---------------------------------------------------------------------
create table if not exists public.transferencias (
  id uuid primary key default gen_random_uuid(),
  data_transferencia date not null default current_date,
  tanque_origem_id uuid not null references public.tanques(id),
  lote_origem_id uuid references public.lotes(id),
  biometria_origem_g numeric(10,3),
  quantidade_origem int not null check (quantidade_origem > 0),
  tanque_destino_id uuid not null references public.tanques(id) check (tanque_destino_id <> tanque_origem_id),
  lote_destino_id uuid references public.lotes(id),
  biometria_destino_g numeric(10,3),
  quantidade_destino int not null check (quantidade_destino > 0),
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.transferencias is 'Aba 10 — Transferência entre tanques. Debita do lote de origem e credita (como nova entrada) no lote de destino.';

create or replace function public.fn_transferencia_before_insert() returns trigger
language plpgsql as $$
declare
  v_codigo text;
begin
  if NEW.lote_origem_id is null then
    NEW.lote_origem_id := public.fn_lote_ativo(NEW.tanque_origem_id);
  end if;
  if NEW.lote_destino_id is null then
    NEW.lote_destino_id := public.fn_lote_ativo(NEW.tanque_destino_id);
    if NEW.lote_destino_id is null then
      v_codigo := public.fn_gerar_codigo_lote(NEW.tanque_destino_id);
      insert into public.lotes (codigo, tanque_id, tipo_peixe, data_abertura, status)
        select v_codigo, NEW.tanque_destino_id, l.tipo_peixe, NEW.data_transferencia, 'ativo'
        from public.lotes l where l.id = NEW.lote_origem_id
        returning id into NEW.lote_destino_id;
    end if;
  end if;
  NEW.created_by := auth.uid();
  return NEW;
end;
$$;
drop trigger if exists trg_transferencia_before_insert on public.transferencias;
create trigger trg_transferencia_before_insert before insert on public.transferencias
  for each row execute function public.fn_transferencia_before_insert();

-- fecha automaticamente o lote de origem se ele esvaziar após a transferência
create or replace function public.fn_transferencia_after_insert() returns trigger
language plpgsql as $$
begin
  if (select estoque_atual from public.v_estoque_lote where lote_id = NEW.lote_origem_id) <= 0 then
    update public.lotes set status = 'encerrado', data_encerramento = NEW.data_transferencia where id = NEW.lote_origem_id;
  end if;
  return NEW;
end;
$$;
-- (trigger criado após a view v_estoque_lote, ver final do arquivo)

-- ---------------------------------------------------------------------
-- DESPESCA (Aba 11) — múltiplas biometrias/quantidades por evento
-- ---------------------------------------------------------------------
create table if not exists public.despescas (
  id uuid primary key default gen_random_uuid(),
  tanque_id uuid not null references public.tanques(id),
  lote_id uuid references public.lotes(id),
  data_despesca date not null default current_date,
  biometrias jsonb not null default '[]'::jsonb, -- [{ "biometria_g": 700, "quantidade": 350 }, ...]
  quantidade_total int,      -- calculado no trigger fn_despesca_before_insert (soma de biometrias)
  peso_medio_g numeric(10,3), -- idem (média ponderada de biometrias)
  cliente_id uuid references public.clientes(id),
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.despescas is 'Aba 11 — Despesca. Permite lançar diversas biometrias/quantidades no mesmo evento; reduz o estoque calculado do lote.';

create or replace function public.fn_despesca_before_insert() returns trigger
language plpgsql as $$
declare v_total_qtd numeric := 0; v_total_peso numeric := 0; elem jsonb;
begin
  if NEW.lote_id is null then
    NEW.lote_id := public.fn_lote_ativo(NEW.tanque_id);
  end if;
  for elem in select * from jsonb_array_elements(NEW.biometrias) loop
    v_total_qtd := v_total_qtd + (elem->>'quantidade')::numeric;
    v_total_peso := v_total_peso + (elem->>'quantidade')::numeric * (elem->>'biometria_g')::numeric;
  end loop;
  NEW.quantidade_total := v_total_qtd;
  if v_total_qtd > 0 then
    NEW.peso_medio_g := round(v_total_peso / v_total_qtd, 2);
  end if;
  if TG_OP = 'INSERT' then
    NEW.created_by := auth.uid();
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_despesca_before_insert on public.despescas;
create trigger trg_despesca_before_insert before insert or update of biometrias on public.despescas
  for each row execute function public.fn_despesca_before_insert();

create or replace function public.fn_despesca_after_insert() returns trigger
language plpgsql as $$
begin
  if (select estoque_atual from public.v_estoque_lote where lote_id = NEW.lote_id) <= 0 then
    update public.lotes set status = 'encerrado', data_encerramento = NEW.data_despesca where id = NEW.lote_id;
  end if;
  return NEW;
end;
$$;
-- (trigger criado após a view v_estoque_lote, ver final do arquivo)

-- ---------------------------------------------------------------------
-- ALIMENTAÇÃO (Aba 8)
-- ---------------------------------------------------------------------
create table if not exists public.alimentacao (
  id uuid primary key default gen_random_uuid(),
  data_trato date not null default current_date,
  hora_trato time not null default now(),
  tanque_id uuid not null references public.tanques(id),
  lote_id uuid references public.lotes(id),
  racao_id uuid references public.racoes(id),
  quantidade_kg numeric(10,3) not null check (quantidade_kg >= 0),
  quantidade_medida_tipo text check (quantidade_medida_tipo in ('copo','balde','kg')),
  quantidade_medida_valor numeric(10,3),
  custo_estimado numeric(12,2),
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.alimentacao is 'Aba 8 — Lançamento de alimentação (trato). custo_estimado é calculado a partir do preço/kg da ração no momento do lançamento.';

create or replace function public.fn_alimentacao_before_insert() returns trigger
language plpgsql as $$
declare v_preco numeric;
begin
  if NEW.lote_id is null then
    NEW.lote_id := public.fn_lote_ativo(NEW.tanque_id);
  end if;
  if NEW.racao_id is not null then
    select preco_unitario_kg into v_preco from public.racoes where id = NEW.racao_id;
    NEW.custo_estimado := round(coalesce(v_preco,0) * NEW.quantidade_kg, 2);
  end if;
  NEW.created_by := auth.uid();
  return NEW;
end;
$$;
drop trigger if exists trg_alimentacao_before_insert on public.alimentacao;
create trigger trg_alimentacao_before_insert before insert on public.alimentacao
  for each row execute function public.fn_alimentacao_before_insert();

-- ---------------------------------------------------------------------
-- MANUTENÇÃO E CUSTOS FIXOS (Aba 13)
-- ---------------------------------------------------------------------
create table if not exists public.custos_fixos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('manutenção','custo fixo')),
  categoria text,          -- ex: energia, água, mão de obra, equipamento, insumo
  descricao text not null,
  tanque_id uuid references public.tanques(id),
  fornecedor_id uuid references public.fornecedores(id),
  valor numeric(12,2) not null default 0,
  recorrente boolean not null default false,
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
comment on table public.custos_fixos is 'Aba 13 — Manutenção e custos fixos.';

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.fn_set_updated_at() returns trigger
language plpgsql as $$ begin NEW.updated_at = now(); return NEW; end; $$;

do $$
declare t text;
begin
  foreach t in array array['empresa','clientes','fornecedores','tanques','racoes','funcionarios'] loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I for each row execute function public.fn_set_updated_at()', t);
  end loop;
end $$;

-- =====================================================================
-- VIEWS DE ESTOQUE / AUTOMAÇÃO (o coração da integração entre abas)
-- =====================================================================
create or replace view public.v_estoque_lote with (security_invoker = true) as
select
  l.id as lote_id,
  l.codigo,
  l.tanque_id,
  t.numero as tanque_numero,
  l.tipo_peixe,
  l.data_abertura,
  l.status,
  coalesce(pov.qtd_povoada, 0) as qtd_povoada,
  coalesce(pov.peso_inicial_medio_g, 0) as peso_inicial_medio_g,
  coalesce(tin.qtd_entrada_transf, 0) as qtd_entrada_transferencia,
  coalesce(mort.qtd_mortalidade, 0) as qtd_mortalidade,
  coalesce(desp.qtd_despescada, 0) as qtd_despescada,
  coalesce(tout.qtd_saida_transf, 0) as qtd_saida_transferencia,
  (coalesce(pov.qtd_povoada,0) + coalesce(tin.qtd_entrada_transf,0)
   - coalesce(mort.qtd_mortalidade,0) - coalesce(desp.qtd_despescada,0) - coalesce(tout.qtd_saida_transf,0)
  ) as estoque_atual,
  greatest(current_date - l.data_abertura, 0) as dias_de_cultivo,
  desp.ultima_data_despesca,
  desp.ultimo_peso_medio_despesca,
  coalesce(desp.biomassa_despescada_kg, 0) as biomassa_despescada_kg,
  coalesce(tout.biomassa_saida_transf_kg, 0) as biomassa_saida_transferencia_kg,
  coalesce(tin.biomassa_entrada_transf_kg, 0) as biomassa_entrada_transferencia_kg,
  tin.ultima_data_entrada_transf,
  tin.ultimo_peso_entrada_transf
from public.lotes l
join public.tanques t on t.id = l.tanque_id
left join (
  select lote_id, sum(quantidade) qtd_povoada,
         round(sum(quantidade * tamanho_peixe_g) / nullif(sum(quantidade),0), 2) peso_inicial_medio_g
  from public.povoamento group by lote_id
) pov on pov.lote_id = l.id
left join (
  select lote_id, sum(quantidade) qtd_mortalidade
  from public.mortalidades group by lote_id
) mort on mort.lote_id = l.id
left join (
  select lote_id, sum(quantidade_total) qtd_despescada,
         sum(quantidade_total * peso_medio_g) / 1000.0 biomassa_despescada_kg,
         max(data_despesca) ultima_data_despesca,
         (array_agg(peso_medio_g order by data_despesca desc))[1] ultimo_peso_medio_despesca
  from public.despescas group by lote_id
) desp on desp.lote_id = l.id
left join (
  select lote_destino_id as lote_id, sum(quantidade_destino) qtd_entrada_transf,
         sum(quantidade_destino * coalesce(biometria_destino_g,0)) / 1000.0 biomassa_entrada_transf_kg,
         max(data_transferencia) ultima_data_entrada_transf,
         (array_agg(biometria_destino_g order by data_transferencia desc))[1] ultimo_peso_entrada_transf
  from public.transferencias group by lote_destino_id
) tin on tin.lote_id = l.id
left join (
  select lote_origem_id as lote_id, sum(quantidade_origem) qtd_saida_transf,
         sum(quantidade_origem * coalesce(biometria_origem_g,0)) / 1000.0 biomassa_saida_transf_kg
  from public.transferencias group by lote_origem_id
) tout on tout.lote_id = l.id;

comment on view public.v_estoque_lote is 'Estoque atual de peixes por lote, calculado a partir de povoamento, mortalidade, despesca e transferências (sem duplicar dados).';

-- peso atual estimado do lote: usa a última biometria real conhecida (despesca parcial
-- ou transferência) recalibrada na curva de nutrição; se não houver, usa dias desde a
-- abertura do lote a partir do peso de povoamento.
create or replace view public.v_lote_status with (security_invoker = true) as
select
  e.*,
  case
    when e.ultima_data_despesca is not null and (e.ultima_data_entrada_transf is null or e.ultima_data_despesca >= e.ultima_data_entrada_transf)
      then public.fn_peso_esperado_por_dias(public.fn_dias_por_peso(e.ultimo_peso_medio_despesca) + (current_date - e.ultima_data_despesca))
    when e.ultima_data_entrada_transf is not null
      then public.fn_peso_esperado_por_dias(public.fn_dias_por_peso(e.ultimo_peso_entrada_transf) + (current_date - e.ultima_data_entrada_transf))
    else public.fn_peso_esperado_por_dias(public.fn_dias_por_peso(e.peso_inicial_medio_g) + e.dias_de_cultivo)
  end as peso_estimado_atual_g
from public.v_estoque_lote e;

comment on view public.v_lote_status is 'v_estoque_lote + peso médio estimado atual (base para a sugestão de trato e para o dashboard de custo do peixe).';

create or replace view public.v_tanque_status with (security_invoker = true) as
select t.*, ls.lote_id, ls.status as status_lote, ls.estoque_atual, ls.peso_estimado_atual_g, ls.dias_de_cultivo,
  round((coalesce(ls.estoque_atual,0) * coalesce(ls.peso_estimado_atual_g,0) / 1000.0)::numeric, 2) as biomassa_atual_kg
from public.tanques t
left join public.v_lote_status ls on ls.tanque_id = t.id and ls.status = 'ativo';

comment on view public.v_tanque_status is 'Visão consolidada por tanque: lote ativo, estoque, peso médio estimado e biomassa atual — usada nas telas de Alimentação/Mortalidade/Transferência/Despesca.';

-- sugestão de trato: junta v_tanque_status com a linha mais próxima da tabela de nutrição
create or replace view public.v_sugestao_trato with (security_invoker = true) as
select
  ts.id as tanque_id, ts.numero as tanque_numero, ts.lote_id, ts.estoque_atual, ts.peso_estimado_atual_g, ts.biomassa_atual_kg,
  n.fase, n.taxa_alimentacao_pct, n.frequencia_dia, n.pellet_mm, n.produto_referencia, n.ca_esperada,
  round((ts.biomassa_atual_kg * coalesce(n.taxa_alimentacao_pct,0) / 100.0)::numeric, 2) as racao_sugerida_dia_kg
from public.v_tanque_status ts
left join lateral (select * from public.fn_linha_nutricao_por_peso(coalesce(ts.peso_estimado_atual_g,0))) n on true
where ts.lote_id is not null;

comment on view public.v_sugestao_trato is 'Aba 8 — Sugestão automática do próximo trato por tanque, a partir da tabela de nutrição de referência (Aba 7).';

-- agora que as views existem, cria os triggers "after insert" que dependem delas
drop trigger if exists trg_transferencia_after_insert on public.transferencias;
create trigger trg_transferencia_after_insert after insert on public.transferencias
  for each row execute function public.fn_transferencia_after_insert();

drop trigger if exists trg_despesca_after_insert on public.despescas;
create trigger trg_despesca_after_insert after insert on public.despescas
  for each row execute function public.fn_despesca_after_insert();

-- =====================================================================
-- VIEWS DE RELATÓRIO / DASHBOARD (Aba 12 + Dashboard)
-- =====================================================================

-- custo de ração por lote (para "gastos de ração por lote" e custo do peixe)
create or replace view public.v_custo_racao_lote with (security_invoker = true) as
select lote_id, sum(quantidade_kg) as racao_total_kg, sum(custo_estimado) as custo_racao_total
from public.alimentacao
group by lote_id;

-- conversão alimentar (CA) e custo por kg/por peixe, por lote
-- ganho de biomassa = tudo que "saiu produzido" (estoque que ainda está no
-- tanque + o que já foi despescado + o que saiu por transferência) menos
-- tudo que "entrou" (povoamento inicial + o que entrou por transferência de
-- outro tanque, que já chega com peso próprio e não é fruto da ração deste lote)
create or replace view public.v_ca_custo_lote with (security_invoker = true) as
select
  ls.lote_id, ls.codigo, ls.tanque_numero, ls.status, ls.data_abertura,
  ls.qtd_povoada, ls.estoque_atual, ls.peso_inicial_medio_g, ls.peso_estimado_atual_g,
  coalesce(cr.racao_total_kg, 0) as racao_total_kg,
  coalesce(cr.custo_racao_total, 0) as custo_racao_total,
  round((
    (ls.estoque_atual * coalesce(ls.peso_estimado_atual_g,0) / 1000.0)
    + ls.biomassa_despescada_kg
    + ls.biomassa_saida_transferencia_kg
    - (ls.qtd_povoada * coalesce(ls.peso_inicial_medio_g,0) / 1000.0)
    - ls.biomassa_entrada_transferencia_kg
  )::numeric, 2) as ganho_biomassa_kg,
  case when (
    (ls.estoque_atual * coalesce(ls.peso_estimado_atual_g,0) / 1000.0)
    + ls.biomassa_despescada_kg + ls.biomassa_saida_transferencia_kg
    - (ls.qtd_povoada * coalesce(ls.peso_inicial_medio_g,0) / 1000.0) - ls.biomassa_entrada_transferencia_kg
  ) > 0
    then round((coalesce(cr.racao_total_kg,0) / (
      (ls.estoque_atual * coalesce(ls.peso_estimado_atual_g,0) / 1000.0)
      + ls.biomassa_despescada_kg + ls.biomassa_saida_transferencia_kg
      - (ls.qtd_povoada * coalesce(ls.peso_inicial_medio_g,0) / 1000.0) - ls.biomassa_entrada_transferencia_kg
    ))::numeric, 3)
    else null
  end as ca_realizada,
  case when ls.estoque_atual > 0
    then round((coalesce(cr.custo_racao_total,0) / ls.estoque_atual)::numeric, 4)
    else null
  end as custo_racao_por_peixe,
  case when ls.estoque_atual > 0 and ls.peso_estimado_atual_g > 0
    then round((coalesce(cr.custo_racao_total,0) / (ls.estoque_atual * ls.peso_estimado_atual_g / 1000.0))::numeric, 2)
    else null
  end as custo_racao_por_kg
from public.v_lote_status ls
left join public.v_custo_racao_lote cr on cr.lote_id = ls.lote_id;

comment on view public.v_ca_custo_lote is 'Conversão alimentar e custo de ração por peixe/kg, por lote — base do Dashboard (CV/CA e custo do peixe).';

-- relação de biometrias (despescas parciais + finais) — Aba 12
create or replace view public.v_biometrias with (security_invoker = true) as
select d.id, d.data_despesca as data, d.tanque_id, t.numero as tanque_numero, d.lote_id, l.codigo as lote_codigo,
  d.peso_medio_g, d.quantidade_total, d.cliente_id, c.nome_cliente
from public.despescas d
join public.tanques t on t.id = d.tanque_id
left join public.lotes l on l.id = d.lote_id
left join public.clientes c on c.id = d.cliente_id;

-- gastos de ração por lote — Aba 12
create or replace view public.v_gastos_racao_lote with (security_invoker = true) as
select a.lote_id, l.codigo as lote_codigo, t.numero as tanque_numero, r.nome_racao,
  sum(a.quantidade_kg) as quantidade_kg, sum(a.custo_estimado) as custo_total,
  min(a.data_trato) as primeiro_trato, max(a.data_trato) as ultimo_trato
from public.alimentacao a
left join public.lotes l on l.id = a.lote_id
left join public.tanques t on t.id = a.tanque_id
left join public.racoes r on r.id = a.racao_id
group by a.lote_id, l.codigo, t.numero, r.nome_racao;

-- =====================================================================
-- FIM DO SCHEMA
-- =====================================================================
