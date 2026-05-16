-- =====================================================================
-- Migration: Functions, Triggers, RLS Helpers
-- =====================================================================

-- ---------------------------------------------------------------------
-- update_updated_at_column()
-- Trigger function genérico para qualquer tabela com coluna updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_kb_chunks_updated_at
  BEFORE UPDATE ON knowledge_base_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sim_payments_updated_at
  BEFORE UPDATE ON simulated_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sim_calendar_updated_at
  BEFORE UPDATE ON simulated_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------
-- current_tenant_id()
-- Resolve tenant_id do usuário logado.
-- STABLE: cacheável por query (anti N+1 RLS).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- generate_quote_number()
-- ORC-YYYY-NNNN, sequência por tenant + ano
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_quote_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_count INT;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
    FROM quotes
    WHERE tenant_id = p_tenant_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  v_number := 'ORC-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- ---------------------------------------------------------------------
-- generate_sale_number()
-- VND-YYYY-NNNN
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_sale_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_count INT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
    FROM sales
    WHERE tenant_id = p_tenant_id
      AND EXTRACT(YEAR FROM closed_at) = EXTRACT(YEAR FROM NOW());
  RETURN 'VND-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------
-- RLS — Habilitar em todas as tabelas
-- ---------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulated_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulated_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- RLS Policies — Padrão da casa
-- SELECT: filtra por tenant_id = current_tenant_id() (SELECT-wrapped)
-- INSERT/UPDATE/DELETE: USING (false) — server-side bypass via service_role
-- ---------------------------------------------------------------------

-- TENANTS: usuário só vê o próprio tenant
CREATE POLICY tenants_select ON tenants FOR SELECT
  USING (id = (SELECT current_tenant_id()));
CREATE POLICY tenants_block_writes ON tenants FOR ALL USING (false);

-- USERS: usuário vê outros do mesmo tenant
CREATE POLICY users_select ON users FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY users_block_writes ON users FOR ALL USING (false);

-- Padrão repetido pra todas as tabelas com tenant_id
CREATE POLICY app_settings_select ON app_settings FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY app_settings_block_writes ON app_settings FOR ALL USING (false);

CREATE POLICY products_select ON products FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY products_block_writes ON products FOR ALL USING (false);

CREATE POLICY variants_select ON product_variants FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY variants_block_writes ON product_variants FOR ALL USING (false);

CREATE POLICY kb_select ON knowledge_base_chunks FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY kb_block_writes ON knowledge_base_chunks FOR ALL USING (false);

CREATE POLICY conversations_select ON conversations FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY conversations_block_writes ON conversations FOR ALL USING (false);

CREATE POLICY messages_select ON messages FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY messages_block_writes ON messages FOR ALL USING (false);

CREATE POLICY quotes_select ON quotes FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY quotes_block_writes ON quotes FOR ALL USING (false);

CREATE POLICY quote_items_select ON quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_items.quote_id
      AND q.tenant_id = (SELECT current_tenant_id())
  ));
CREATE POLICY quote_items_block_writes ON quote_items FOR ALL USING (false);

CREATE POLICY sales_select ON sales FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY sales_block_writes ON sales FOR ALL USING (false);

CREATE POLICY sim_payments_select ON simulated_payments FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY sim_payments_block_writes ON simulated_payments FOR ALL USING (false);

CREATE POLICY sim_calendar_select ON simulated_calendar_events FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY sim_calendar_block_writes ON simulated_calendar_events FOR ALL USING (false);

CREATE POLICY handoffs_select ON conversation_handoffs FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY handoffs_block_writes ON conversation_handoffs FOR ALL USING (false);

CREATE POLICY ai_inv_select ON ai_invocations FOR SELECT
  USING (tenant_id = (SELECT current_tenant_id()));
CREATE POLICY ai_inv_block_writes ON ai_invocations FOR ALL USING (false);

-- processed_events e error_log: server-only sempre, sem leitura via RLS
CREATE POLICY processed_events_block_all ON processed_events FOR ALL USING (false);
CREATE POLICY error_log_block_all ON error_log FOR ALL USING (false);
