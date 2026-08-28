-- =====================================================================
-- HARDENING — correções apontadas pelo Security Advisor do Supabase
-- Rodar depois de 01_schema.sql, 02_rls.sql, 03_seed_nutricao.sql e
-- 04_seed_tanques.sql. (Já aplicado no projeto ao vivo deste app como as
-- migrations "03_hardening_search_path_and_grants" e
-- "04_hardening_revoke_anon_execute" — este arquivo só documenta e
-- reproduz essas mudanças para quem for recriar o banco do zero.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) search_path fixo em todas as funções do schema public
--    Sem isso, uma função SECURITY DEFINER (ou até uma função comum
--    chamada a partir de um contexto com search_path alterado) pode ser
--    enganada para resolver um nome de tabela/função para um objeto de
--    outro schema controlado por um usuário malicioso ("search_path
--    hijacking"). Fixar search_path = public elimina esse vetor.
-- ---------------------------------------------------------------------
alter function public.existe_admin() set search_path = public;
alter function public.fn_alimentacao_before_insert() set search_path = public;
alter function public.fn_despesca_after_insert() set search_path = public;
alter function public.fn_despesca_before_insert() set search_path = public;
alter function public.fn_dias_por_peso(numeric) set search_path = public;
alter function public.fn_gerar_codigo_lote(uuid) set search_path = public;
alter function public.fn_linha_nutricao_por_peso(numeric) set search_path = public;
alter function public.fn_lote_ativo(uuid) set search_path = public;
alter function public.fn_mortalidade_before_insert() set search_path = public;
alter function public.fn_peso_esperado_por_dias(int) set search_path = public;
alter function public.fn_povoamento_before_insert() set search_path = public;
alter function public.fn_set_updated_at() set search_path = public;
alter function public.fn_sync_tanque_lote() set search_path = public;
alter function public.fn_transferencia_after_insert() set search_path = public;
alter function public.fn_transferencia_before_insert() set search_path = public;
alter function public.meu_papel() set search_path = public;
alter function public.sou_admin() set search_path = public;
alter function public.tenho_login() set search_path = public;

-- ---------------------------------------------------------------------
-- 2) Revogar EXECUTE de "anon" nas funções auxiliares SECURITY DEFINER
--    Estas 5 funções decidem permissão (usadas dentro das políticas de
--    RLS) e por padrão o Supabase concede EXECUTE também a "anon" (não
--    logado) e "authenticated" na criação. Um usuário anônimo não
--    precisa (e não deve) poder chamá-las via RPC pública. Mantemos
--    "authenticated" pois as próprias políticas de RLS dependem de
--    chamar essas funções como o usuário logado.
--    Obs.: revogar de PUBLIC sozinho NÃO é suficiente — o Supabase
--    concede a "anon"/"authenticated" diretamente via default
--    privileges no momento da criação da função, independente do
--    pseudo-papel PUBLIC. É preciso revogar de "anon" explicitamente.
-- ---------------------------------------------------------------------
revoke execute on function public.existe_admin()        from public, anon;
revoke execute on function public.fn_sync_tanque_lote()  from public, anon;
revoke execute on function public.meu_papel()            from public, anon;
revoke execute on function public.sou_admin()            from public, anon;
revoke execute on function public.tenho_login()          from public, anon;

-- =====================================================================
-- FIM DO HARDENING
-- =====================================================================
