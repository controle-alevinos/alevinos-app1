-- =====================================================================
-- BOOTSTRAP DO PRIMEIRO ADMIN
-- Rode isso DEPOIS de criar o primeiro usuário (Authentication > Users >
-- Add user, ou pela própria tela de login do app "Criar conta").
-- =====================================================================

-- 1) Descubra o UUID do usuário que acabou de criar:
select id, email from auth.users order by created_at desc limit 5;

-- 2) Cole o UUID encontrado no lugar de 'COLE-O-UUID-AQUI' e rode:
insert into public.funcionarios (user_id, nome, cargo, papel, ativo)
values ('COLE-O-UUID-AQUI', 'Administrador', 'Gestor', 'admin', true)
on conflict (user_id) do update set papel = 'admin', ativo = true;

-- Pronto: esse usuário agora enxerga e edita tudo no sistema.
-- Para os próximos funcionários, cadastre-os pela própria tela "Funcionários"
-- do app (como admin) informando o e-mail — o app cria o login e o registro
-- de funcionário junto, já vinculados.
