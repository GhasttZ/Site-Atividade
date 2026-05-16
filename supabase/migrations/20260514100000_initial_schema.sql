-- =====================================================================
-- Migration: Initial Schema
-- Project:   Malharia Bonfim — Atendente IA Demo
-- Author:    Arquiteto Full-Stack
-- =====================================================================
-- Estratégia: shared schema multi-tenant ready.
-- Toda tabela tem tenant_id, created_at, updated_at e UUID PK.
-- RLS habilitado em todas; policies vivem na migration 100100.
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- TENANTS
-- ---------------------------------------------------------------------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- USERS (operadores do painel)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- references auth.users(id)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ---------------------------------------------------------------------
-- APP SETTINGS (config por tenant)
-- ---------------------------------------------------------------------
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  agent_tone TEXT NOT NULL DEFAULT 'profissional_acolhedor',
  business_hours JSONB NOT NULL DEFAULT
    '{"mon":"08:00-18:00","tue":"08:00-18:00","wed":"08:00-18:00","thu":"08:00-18:00","fri":"08:00-18:00","sat":"08:00-12:00","sun":"closed"}'::JSONB,
  autonomous_sale_max_pieces INT NOT NULL DEFAULT 50 CHECK (autonomous_sale_max_pieces > 0),
  autonomous_discount_max_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00
    CHECK (autonomous_discount_max_pct >= 0 AND autonomous_discount_max_pct <= 100),
  presentation_mode BOOLEAN NOT NULL DEFAULT FALSE,
  dpo_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PRODUCTS (catálogo)
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  category TEXT NOT NULL CHECK (category IN (
    'fardamento_escolar', 'fardamento_empresarial', 'bolsas'
  )),
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  production_days_min INT NOT NULL CHECK (production_days_min > 0),
  production_days_max INT NOT NULL CHECK (production_days_max >= production_days_min),
  minimum_order_qty INT NOT NULL DEFAULT 10 CHECK (minimum_order_qty > 0),
  customization_options JSONB NOT NULL DEFAULT '[]'::JSONB,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_tenant_sku_unique UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, active);

-- ---------------------------------------------------------------------
-- PRODUCT VARIANTS (tamanhos / cores)
-- ---------------------------------------------------------------------
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  sku_suffix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ---------------------------------------------------------------------
-- KNOWLEDGE BASE CHUNKS (políticas, FAQ, tom de voz)
-- ---------------------------------------------------------------------
CREATE TABLE knowledge_base_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'politica_pagamento', 'politica_prazo', 'politica_entrega',
    'politica_troca', 'faq', 'tom_de_voz', 'sobre_empresa'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kb_tenant_category ON knowledge_base_chunks(tenant_id, category)
  WHERE active = TRUE;

-- ---------------------------------------------------------------------
-- CONVERSATIONS (1 por número de contato)
-- ---------------------------------------------------------------------
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'handoff'))
    DEFAULT 'active',
  ai_handoff_reason TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_tenant_phone_unique UNIQUE (tenant_id, contact_phone)
);
CREATE INDEX idx_conversations_tenant_status
  ON conversations(tenant_id, status, last_message_at DESC);

-- ---------------------------------------------------------------------
-- MESSAGES (turnos da conversa)
-- ---------------------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender TEXT NOT NULL CHECK (sender IN ('contact', 'ai', 'human_agent')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);

-- ---------------------------------------------------------------------
-- IDEMPOTENCY: processed_events (webhooks de Evolution e outros)
-- ---------------------------------------------------------------------
CREATE TABLE processed_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_processed_events_source ON processed_events(source, processed_at DESC);

-- ---------------------------------------------------------------------
-- ERROR LOG (cross-cutting, alimentado pelo workflow 99 do n8n)
-- ---------------------------------------------------------------------
CREATE TABLE error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  source TEXT NOT NULL,  -- 'n8n', 'web', 'edge_function'
  workflow_name TEXT,
  error_code TEXT,
  error_message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_error_log_source_created ON error_log(source, created_at DESC);
