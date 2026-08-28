-- Aba 3 — pré-cadastro dos 26 tanques (edite depois na tela de Tanques
-- para preencher medidas, capacidade, estufa, aeradores etc.)
insert into public.tanques (numero, nome)
values
  (1, 'Tanque 01'),
  (2, 'Tanque 02'),
  (3, 'Tanque 03'),
  (4, 'Tanque 04'),
  (5, 'Tanque 05'),
  (6, 'Tanque 06'),
  (7, 'Tanque 07'),
  (8, 'Tanque 08'),
  (9, 'Tanque 09'),
  (10, 'Tanque 10'),
  (11, 'Tanque 11'),
  (12, 'Tanque 12'),
  (13, 'Tanque 13'),
  (14, 'Tanque 14'),
  (15, 'Tanque 15'),
  (16, 'Tanque 16'),
  (17, 'Tanque 17'),
  (18, 'Tanque 18'),
  (19, 'Tanque 19'),
  (20, 'Tanque 20'),
  (21, 'Tanque 21'),
  (22, 'Tanque 22'),
  (23, 'Tanque 23'),
  (24, 'Tanque 24'),
  (25, 'Tanque 25'),
  (26, 'Tanque 26')
on conflict (numero) do nothing;
