-- Dados de referência: curva de crescimento (tilápia) até 24 semanas / 740g
-- Importado de: tabela crescimento até 24 semanas_v1 740g teste.xlsx
truncate table public.tabela_nutricao restart identity cascade;

insert into public.tabela_nutricao
  (ordem, fase, semana, dias, peso_g, comprimento_cm, ganho_semanal_g, pb_percent, taxa_alimentacao_pct, racao_1000_peixes_kg_dia, frequencia_dia, ca_esperada, pellet_mm, produto_referencia, sistema_recomendado)
values
  (0, 'Pós-larva', 0, 1, 0.05, '<1,5', NULL, 47.5, 20, NULL, '8-10', NULL, 'Pó <0,5mm', 'GuabiTech Impulse 55 (Pó)', 'Viveiro/Berçário'),
  (1, 'Alevinagem I', 1, 7, 0.5, '1,5-2,5', 0.5, 40, 9, 0.045, '6', '0,8-1,2', '0,5-1mm', 'GuabiTech Eco Alevinos I (1mm)', 'Viveiro/Berçário'),
  (2, 'Alevinagem I', 2, 14, 1.5, '2,5-3,5', 1.0, 40, 7.5, 0.1125, '6', '0,8-1,2', '0,5-1mm', 'GuabiTech Eco Alevinos I (1mm)', 'Viveiro/Berçário'),
  (3, 'Alevinagem I', 3, 21, 3, '3,5-4,5', 1.5, 40, 6.5, 0.195, '5', '0,8-1,2', '1-1,5mm', 'GuabiTech Eco Alevinos I (1mm)', 'Viveiro/Berçário'),
  (4, 'Alevinagem I', 4, 28, 6, '5,0-6,5', 3.0, 40, 6, 0.36, '5', '0,9-1,3', '1-1,5mm', 'GuabiTech Eco Alevinos I (1mm)', 'Viveiro/Berçário'),
  (5, 'Alevinagem II', 5, 35, 10, '6,5-8,0', 4.0, 40, 6, 0.6, '4', '0,9-1,3', '1,5mm', 'GuabiTech Eco Alevinos II (1,7mm)', 'Viveiro/Berçário'),
  (6, 'Recria I', 6, 42, 15, '8,0-9,5', 5.0, 36, 5, 0.75, '4', '1,0-1,4', '1,5-2mm', 'Pirá Evolution Juvenil (2mm)', 'Tanque-rede / Viveiro'),
  (7, 'Recria I', 7, 49, 22, '9,5-11,0', 7.0, 36, 5, 1.1, '4', '1,0-1,4', '1,5-2mm', 'Pirá Evolution Juvenil (2mm)', 'Tanque-rede / Viveiro'),
  (8, 'Recria I', 8, 56, 32, '10,5-12,5', 10.0, 36, 4.5, 1.44, '3', '1,1-1,5', '2mm', 'Pirá Evolution Juvenil (3mm)', 'Tanque-rede / Viveiro'),
  (9, 'Recria II', 9, 63, 45, '12,0-14,0', 13.0, 32, 4.5, 2.025, '3', '1,1-1,5', '2mm', 'Pirá Evolution TR (4mm)', 'Tanque-rede / Viveiro'),
  (10, 'Recria II', 10, 70, 63, '13,5-15,5', 18.0, 32, 4, 2.52, '3', '1,2-1,6', '2mm', 'Pirá Evolution TR (4mm)', 'Tanque-rede / Viveiro'),
  (11, 'Recria II', 11, 77, 88, '15,0-17,0', 25.0, 32, 4, 3.52, '3', '1,2-1,6', '2-3mm', 'Pirá Evolution TR (4mm)', 'Tanque-rede / Viveiro'),
  (12, 'Crescimento I', 12, 84, 122, '17,0-19,0', 34.0, 32, 3.5, 4.27, '2', '1,3-1,7', '3mm', 'Pirá 32 / Pirá Crescimento (4mm)', 'Tanque-rede'),
  (13, 'Crescimento I', 13, 91, 170, '19,0-21,5', 48.0, 32, 3.5, 5.95, '2', '1,3-1,7', '3mm', 'Pirá 32 / Pirá Crescimento (4mm)', 'Tanque-rede'),
  (14, 'Crescimento I', 14, 98, 230, '20,5-23,5', 60.0, 32, 3, 6.9, '2', '1,4-1,8', '3-4mm', 'Pirá 32 / Pirá Crescimento (4mm)', 'Tanque-rede'),
  (15, 'Crescimento II', 15, 105, 290, '22,5-25,5', 60.0, 32, 3, 8.7, '2', '1,4-1,8', '3-4mm', 'Pirá 32 / Pirá Crescimento (4mm)', 'Tanque-rede'),
  (16, 'Crescimento II', 16, 112, 360, '24,0-27,5', 70.0, 32, 2.5, 9, '2', '1,5-1,9', '4mm', 'Pirá 32 / Pirá Crescimento (6mm)', 'Tanque-rede'),
  (17, 'Crescimento II', 17, 119, 410, '26,0-29,0', 50.0, 32, 2.5, 10.25, '2', '1,5-1,9', '4mm', 'Pirá 32 / Pirá Crescimento (6mm)', 'Tanque-rede'),
  (18, 'Engorda I', 18, 126, 450, '27,0-30,0', 40.0, 28, 2.2, 9.9, '2', '1,6-2,0', '4-6mm', 'Pirá Evolution TE (28%)', 'Tanque-rede'),
  (19, 'Engorda I', 19, 133, 490, '28,0-31,0', 40.0, 28, 2, 9.8, '2', '1,6-2,0', '4-6mm', 'Pirá Evolution TE (28%)', 'Tanque-rede'),
  (20, 'Engorda II', 20, 140, 530, '29,0-32,0', 40.0, 28, 1.8, 9.54, '2', '1,7-2,1', '4-6mm', 'Pirá Acabamento (28%)', 'Tanque-rede'),
  (21, 'Engorda II', 21, 147, 570, '30,0-33,0', 40.0, 28, 1.8, 10.26, '2', '1,7-2,1', '4-6mm', 'Pirá Acabamento (28%)', 'Tanque-rede'),
  (22, 'Engorda II', 22, 154, 610, '30,0-33,0', 40.0, 28, 1.8, 10.98, '1-2', '1,7-2,1', '6-8mm', 'Pirá Acabamento (28%)', 'Tanque-rede'),
  (23, 'Engorda II', 23, 162, 650, '32,0-35,0', 40.0, 28, 1.5, 9.75, '1-2', '1,8-2,2', '6-8mm', 'Pirá Acabamento (28%)', 'Tanque-rede'),
  (24, 'Abate', 24, 168, 740, '33,0-37,0', 60.0, 28, 1.5, 11.1, '1-2', '1,8-2,2', '6-8mm', 'Pirá Acabamento (28%)', 'Tanque-rede');
