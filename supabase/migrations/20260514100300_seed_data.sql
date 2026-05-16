-- =====================================================================
-- Migration: Seed Data — Malharia Bonfim (Caruaru/PE)
-- Catálogo fictício plausível + base de conhecimento.
-- Histórico de conversas/orçamentos/vendas (demo data) é gerado por
-- script TS separado (scripts/seed-demo-data.ts), executado pós-deploy.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TENANT
-- ---------------------------------------------------------------------
INSERT INTO tenants (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Malharia Bonfim', 'malharia-bonfim');

-- ---------------------------------------------------------------------
-- APP SETTINGS
-- ---------------------------------------------------------------------
INSERT INTO app_settings (
  tenant_id, agent_tone, autonomous_sale_max_pieces, autonomous_discount_max_pct,
  presentation_mode, dpo_email
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'profissional_acolhedor_nordestino',
  50,
  5.00,
  FALSE,
  'contato@malhariabonfim.com.br'
);

-- ---------------------------------------------------------------------
-- PRODUCTS — Fardamento Escolar
-- ---------------------------------------------------------------------
INSERT INTO products (tenant_id, sku, name, category, description, base_price,
  production_days_min, production_days_max, minimum_order_qty, customization_options)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ESC-CAM-001',
   'Camiseta Escolar Manga Curta', 'fardamento_escolar',
   'Malha PV (poliéster + viscose), gola careca, costura reforçada. Disponível PP ao GG.',
   18.90, 7, 12, 20,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":6.00},
     {"type":"silk","label":"Silk no peito","price_per_piece":4.00},
     {"type":"silk_dupla","label":"Silk frente e costas","price_per_piece":7.50}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'ESC-POL-001',
   'Polo Escolar Piquet', 'fardamento_escolar',
   'Piquet 100% algodão, gola polo, dois botões, ideal para colégios mais formais.',
   32.50, 8, 14, 20,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":6.00},
     {"type":"silk","label":"Silk no peito","price_per_piece":4.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'ESC-AGS-001',
   'Agasalho Escolar (Conjunto Jaqueta + Calça)', 'fardamento_escolar',
   'Moletom flanelado, jaqueta com zíper, calça com elástico e cordão.',
   89.00, 12, 18, 15,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":8.00},
     {"type":"silk","label":"Silk costas","price_per_piece":6.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'ESC-BER-001',
   'Bermuda Escolar Tactel', 'fardamento_escolar',
   'Tactel resistente, elástico ajustável, ideal pra educação física.',
   24.90, 7, 12, 20,
   '[{"type":"silk","label":"Silk na perna","price_per_piece":3.50}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'ESC-REG-001',
   'Regata Educação Física', 'fardamento_escolar',
   'Dry-fit, alta performance, secagem rápida.',
   22.50, 7, 12, 20,
   '[{"type":"silk","label":"Silk frente e costas","price_per_piece":5.00}]'::JSONB);

-- ---------------------------------------------------------------------
-- PRODUCTS — Fardamento Empresarial
-- ---------------------------------------------------------------------
INSERT INTO products (tenant_id, sku, name, category, description, base_price,
  production_days_min, production_days_max, minimum_order_qty, customization_options)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'EMP-CAM-001',
   'Camiseta Empresarial Básica', 'fardamento_empresarial',
   'Malha PV, gola careca, ótima para uniforme operacional e brindes.',
   16.50, 7, 12, 30,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":6.00},
     {"type":"silk","label":"Silk no peito","price_per_piece":4.00},
     {"type":"silk_dupla","label":"Silk frente e costas","price_per_piece":7.50},
     {"type":"sublimacao","label":"Sublimação total","price_per_piece":12.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'EMP-POL-001',
   'Polo Piquet Empresarial', 'fardamento_empresarial',
   'Piquet de algodão, gola polo, costura reforçada, ideal para equipe comercial.',
   38.00, 10, 16, 25,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":6.00},
     {"type":"silk","label":"Silk no peito","price_per_piece":4.00},
     {"type":"bordado_dupla","label":"Bordado peito + manga","price_per_piece":9.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'EMP-CMS-001',
   'Camisa Social Manga Longa', 'fardamento_empresarial',
   'Tecido misto, acabamento premium, para recepção/atendimento.',
   72.00, 14, 21, 20,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":7.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'EMP-JAL-001',
   'Jaleco Microfibra', 'fardamento_empresarial',
   'Microfibra antibacteriana, ideal para clínicas e laboratórios.',
   58.00, 10, 15, 15,
   '[{"type":"bordado","label":"Bordado nome + função","price_per_piece":10.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'EMP-AVE-001',
   'Avental Brim', 'fardamento_empresarial',
   'Brim resistente, com bolso frontal, ideal para cozinha/oficina.',
   34.00, 7, 12, 15,
   '[{"type":"bordado","label":"Bordado no peito","price_per_piece":7.00},
     {"type":"silk","label":"Silk no peito","price_per_piece":4.50}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'EMP-JAQ-001',
   'Jaqueta Corporativa Helanca', 'fardamento_empresarial',
   'Helanca pesada, com zíper, gola careca, costura dupla.',
   95.00, 12, 18, 15,
   '[{"type":"bordado","label":"Bordado peito + costas","price_per_piece":11.00}]'::JSONB);

-- ---------------------------------------------------------------------
-- PRODUCTS — Bolsas
-- ---------------------------------------------------------------------
INSERT INTO products (tenant_id, sku, name, category, description, base_price,
  production_days_min, production_days_max, minimum_order_qty, customization_options)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'BOL-SAC-001',
   'Sacola Personalizada Algodão Cru', 'bolsas',
   'Sacola de algodão cru 100%, alça reforçada, 40x35cm.',
   12.50, 5, 10, 50,
   '[{"type":"silk","label":"Silk 1 cor","price_per_piece":2.50},
     {"type":"silk_color","label":"Silk até 3 cores","price_per_piece":5.00},
     {"type":"sublimacao","label":"Sublimação total","price_per_piece":8.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'BOL-ECO-001',
   'Ecobag TNT', 'bolsas',
   'TNT 80g, alça longa, ideal para brindes em massa.',
   4.20, 5, 10, 100,
   '[{"type":"silk","label":"Silk 1 cor","price_per_piece":1.50}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'BOL-MOC-001',
   'Mochila Escolar Nylon 600', 'bolsas',
   'Nylon 600 reforçado, bolso frontal, alças acolchoadas.',
   78.00, 12, 18, 20,
   '[{"type":"bordado","label":"Bordado no bolso","price_per_piece":8.00},
     {"type":"silk","label":"Silk no bolso","price_per_piece":5.00}]'::JSONB),

  ('00000000-0000-0000-0000-000000000001', 'BOL-NEC-001',
   'Necessaire Personalizada', 'bolsas',
   'Lona impermeabilizada, zíper YKK, 22x15cm.',
   18.00, 7, 12, 30,
   '[{"type":"bordado","label":"Bordado","price_per_piece":6.00},
     {"type":"silk","label":"Silk","price_per_piece":3.50}]'::JSONB);

-- ---------------------------------------------------------------------
-- KNOWLEDGE BASE — Sobre a empresa
-- ---------------------------------------------------------------------
INSERT INTO knowledge_base_chunks (tenant_id, category, title, content, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'sobre_empresa', 'Apresentação',
   'A Malharia Bonfim é uma confecção têxtil com 12 anos de mercado, sediada em Caruaru/PE. Atendemos PE, PB e AL com fardamento escolar, fardamento empresarial e bolsas personalizadas. Trabalhamos com pedidos a partir de 10 peças, com produção em prazos médios de 7 a 21 dias úteis dependendo da customização.', 10);

INSERT INTO knowledge_base_chunks (tenant_id, category, title, content, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'politica_pagamento', 'Formas de pagamento',
   'Aceitamos Pix (com 5% de desconto à vista), cartão de crédito (em até 6x sem juros, 7x ou mais com juros da operadora), ou boleto (50% entrada + 50% na entrega). Pix tem confirmação instantânea, cartão entra em produção após aprovação.', 9),

  ('00000000-0000-0000-0000-000000000001', 'politica_prazo', 'Prazos de produção',
   'Pedidos sem customização: 7 a 12 dias úteis. Pedidos com bordado ou silk: 8 a 15 dias úteis. Pedidos com sublimação total ou customização complexa: 12 a 21 dias úteis. Pedidos grandes (>200 peças) podem ter prazo estendido — confirmamos antes de fechar.', 9),

  ('00000000-0000-0000-0000-000000000001', 'politica_entrega', 'Entrega',
   'Retirada em Caruaru/PE sem custo. Entrega via transportadora para PE, PB e AL com frete cotado por CEP. Entrega expressa para Recife (1 dia útil) com taxa adicional.', 7),

  ('00000000-0000-0000-0000-000000000001', 'politica_troca', 'Política de troca',
   'Garantia de 7 dias após recebimento para defeito de fabricação. Trocas por tamanho ou cor são analisadas caso a caso. Produtos com customização (bordado/silk personalizado) não têm troca por arrependimento.', 6),

  ('00000000-0000-0000-0000-000000000001', 'tom_de_voz', 'Como conversar',
   'Tom acolhedor e direto, usando português brasileiro contemporâneo com leves marcadores nordestinos (sem caricatura). Tratar cliente por "você", não "senhor/senhora" exceto se ele iniciar formal. Frases curtas, sem rebuscar. Usar "show", "tranquilo", "fechado" naturalmente. Nunca usar "estimado cliente", "vossa senhoria", "no aguardo de seu retorno".', 10),

  ('00000000-0000-0000-0000-000000000001', 'faq', 'Pedido mínimo',
   'O pedido mínimo varia por produto, mas em geral é 10-30 peças. Para bolsas tipo ecobag pode chegar a 100 peças por causa do custo unitário baixo. Sempre conferir o produto específico no catálogo.', 8),

  ('00000000-0000-0000-0000-000000000001', 'faq', 'Customização com logo',
   'Cliente deve enviar a arte em PDF, AI, EPS, CDR ou PNG em alta resolução (mínimo 300dpi). Se não tiver, oferecemos serviço de digitalização/vetorização por R$ 80 (cobrado uma única vez). O bordado fica em até 4 cores; silk em até 6 cores; sublimação aceita arte sem limite.', 7);
