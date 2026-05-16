-- =====================================================================
-- Migration: Quotes, Sales, Simulations, Handoffs, AI Logging
-- =====================================================================

-- ---------------------------------------------------------------------
-- QUOTES (orçamentos gerados pela IA)
-- ---------------------------------------------------------------------
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL UNIQUE,  -- ORC-2026-0001
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted_to_sale'
  )) DEFAULT 'draft',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (discount_pct >= 0 AND discount_pct <= 100),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  production_days INT,
  valid_until DATE NOT NULL,
  notes TEXT,
  generated_by_ai BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_quotes_tenant_status
  ON quotes(tenant_id, status, created_at DESC);
CREATE INDEX idx_quotes_conversation ON quotes(conversation_id);

-- ---------------------------------------------------------------------
-- QUOTE ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_snapshot TEXT NOT NULL,  -- snapshot p/ históricos consistentes
  variant_size TEXT,
  variant_color TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  customization JSONB NOT NULL DEFAULT '[]'::JSONB,
  customization_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (customization_total >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- ---------------------------------------------------------------------
-- SALES (vendas fechadas)
-- ---------------------------------------------------------------------
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  sale_number TEXT NOT NULL UNIQUE,  -- VND-2026-0001
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL CHECK (status IN (
    'paid', 'producing', 'shipped', 'delivered', 'cancelled'
  )) DEFAULT 'paid',
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sales_tenant_status
  ON sales(tenant_id, status, closed_at DESC);
CREATE INDEX idx_sales_tenant_closed
  ON sales(tenant_id, closed_at DESC);  -- pra dashboard

-- ---------------------------------------------------------------------
-- SIMULATED PAYMENTS (sem gateway real)
-- ---------------------------------------------------------------------
CREATE TABLE simulated_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('pix', 'cartao_credito', 'boleto')),
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'paid', 'expired', 'refunded'
  )) DEFAULT 'pending',
  pix_qr_code_url TEXT,        -- placeholder gerado client-side
  payment_link TEXT,            -- URL fake estruturada
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sim_payments_tenant_status
  ON simulated_payments(tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------
-- SIMULATED CALENDAR EVENTS
-- ---------------------------------------------------------------------
CREATE TABLE simulated_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  title TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN (
    'presencial', 'video', 'telefone'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'scheduled', 'confirmed', 'cancelled', 'completed'
  )) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sim_calendar_tenant_date
  ON simulated_calendar_events(tenant_id, scheduled_for);

-- ---------------------------------------------------------------------
-- CONVERSATION HANDOFFS (log de quando IA escalou)
-- ---------------------------------------------------------------------
CREATE TABLE conversation_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'cliente_pediu', 'xingamento', 'reclamacao_pos_venda',
    'limite_pedido', 'ia_nao_entendeu', 'negociacao_fora_politica'
  )),
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);
CREATE INDEX idx_handoffs_tenant_unresolved
  ON conversation_handoffs(tenant_id, escalated_at DESC)
  WHERE resolved_at IS NULL;

-- ---------------------------------------------------------------------
-- AI INVOCATIONS (observabilidade leve)
-- ---------------------------------------------------------------------
CREATE TABLE ai_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'openrouter', 'anthropic', 'openai'
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  latency_ms INT,
  tool_calls JSONB NOT NULL DEFAULT '[]'::JSONB,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_invocations_tenant_created
  ON ai_invocations(tenant_id, created_at DESC);
CREATE INDEX idx_ai_invocations_model
  ON ai_invocations(tenant_id, model_used, created_at DESC);
