# Handoff para Claude Code — Entrega 1 (Fundação)

> **Para quem este documento foi escrito:** Claude Code, atuando como
> engenheiro full-stack sênior, executando o bootstrap inicial do projeto
> "Malharia Bonfim — Atendente IA Demo".
>
> **O que você (Claude Code) vai fazer:** receber 24 arquivos pré-escritos,
> criar a infraestrutura (Supabase + Vercel), aplicar migrations, instalar
> dependências, validar que tudo conecta, e deixar o projeto pronto para a
> **Entrega 2** (domain logic + repositories + server actions).
>
> **O que você NÃO vai fazer ainda:** criar componentes React, criar páginas
> do dashboard, configurar PWA, escrever workflows n8n. Tudo isso vem nas
> próximas entregas.

---

## ÍNDICE

1. [Contexto do projeto](#1-contexto-do-projeto)
2. [Pré-requisitos (o que você precisa ter)](#2-pré-requisitos)
3. [Setup inicial — passo a passo](#3-setup-inicial)
4. [Estrutura de arquivos completa](#4-estrutura-de-arquivos-completa)
5. [Explicação detalhada de cada arquivo](#5-explicação-detalhada-de-cada-arquivo)
   - 5.1 [Migrations SQL](#51-migrations-sql)
   - 5.2 [Camada de IA (`lib/ai/`)](#52-camada-de-ia)
   - 5.3 [Clients Supabase (`lib/supabase/`)](#53-clients-supabase)
   - 5.4 [Schemas Zod (`lib/schemas/`)](#54-schemas-zod)
   - 5.5 [Middleware raiz](#55-middleware-raiz)
   - 5.6 [Configuração (package.json, tsconfig, env)](#56-configuração)
6. [Sequência de execução recomendada](#6-sequência-de-execução-recomendada)
7. [Critérios de sucesso (smoke tests)](#7-critérios-de-sucesso)
8. [Problemas comuns e como resolver](#8-problemas-comuns)
9. [O que vem nas próximas entregas](#9-o-que-vem-depois)

---

## 1. CONTEXTO DO PROJETO

### O que estamos construindo

Uma **demo comercial** de atendimento autônomo via WhatsApp para a
"Malharia Bonfim" — empresa fictícia de confecção de malhas em Caruaru/PE,
focada em fardamento escolar, fardamento empresarial e bolsas. A demo
é asset de portfólio para vender projetos similares para clientes reais.

A solução tem **três planos**:

1. **Agente de IA conversacional** rodando como workflow no n8n,
   recebendo mensagens via Evolution API, processando com OpenRouter
   (modelos gratuitos), e respondendo de volta via WhatsApp.

2. **Painel web em Next.js 15** (com PWA via Serwist) onde o operador
   acompanha conversas, orçamentos, agenda, métricas, e configura o
   sistema.

3. **Banco de dados Postgres no Supabase** com schema multi-tenant
   ready, RLS habilitado, e seed data fictício plausível.

### Stack confirmada

| Camada | Tecnologia | Versão alvo |
|---|---|---|
| Frontend | Next.js | 15.1+ App Router |
| Linguagem | TypeScript | 5.7+ strict total |
| Estilo | Tailwind CSS | v4 |
| UI | shadcn/ui + Radix | latest |
| Forms | React Hook Form + Zod | latest |
| Tabelas | TanStack Table | v8 |
| PWA | Serwist | 9+ |
| Backend | Supabase | Postgres 16 |
| Validação | Zod | 3.24+ |
| Automação | n8n | self-hosted (já operando) |
| WhatsApp | Evolution API | self-hosted (já operando) |
| LLM Gateway | OpenRouter | API + modelos gratuitos |

### Princípios não-negociáveis de código

- TypeScript **strict total** (`noImplicitAny`, `strictNullChecks`, etc.).
  Sem `any` (use `unknown` quando necessário).
- Schemas Zod como **fonte única** da verdade; tipos TS derivados via
  `z.infer`. Nunca declarar tipo TS puro para dados externos.
- Cada arquivo ≤ **200 linhas**. Cada função ≤ **20 linhas**. Cada classe
  com **uma responsabilidade**.
- **Dependency injection** via constructor. Sem `new SomeService()`
  dentro de outro service.
- **Server Components por default**. `"use client"` só onde precisa
  interatividade ou hooks de browser.
- **RLS para reads**; mutations sempre via server action usando
  `supabaseAdmin` (service_role) **após** validar `auth.getUser()`.
- **Polimorfismo > if-else chain**. Se tem 3+ branches sobre type/status,
  vira Strategy pattern.

---

## 2. PRÉ-REQUISITOS

### Contas que você precisa criar antes

1. **Conta Supabase** — https://supabase.com (free tier)
2. **Conta Vercel** — https://vercel.com (free tier Hobby)
3. **Conta OpenRouter** — https://openrouter.ai (free, sem cartão)
4. **Conta GitHub** — para versionamento e CI/CD
5. **Bot do Telegram** — para alertas (opcional na Entrega 1, mas
   variável já provisionada no `.env.example`)

### Ferramentas instaladas no ambiente

```bash
# Verificar antes de começar:
node --version    # >= 20.0.0
npm --version     # >= 10.0.0
git --version     # qualquer recente
npx --version     # vem com npm

# Instalar Supabase CLI globalmente (se ainda não tem):
npm install -g supabase

# Verificar:
supabase --version  # >= 1.200.0
```

### Acesso a sistemas já operando (do operador)

- **VPS com n8n rodando** — credencial e URL da instância
- **VPS com Evolution API rodando** — credencial e URL da instância
- **Domínio** ou subdomínio onde a demo será hospedada

---

## 3. SETUP INICIAL

> **Faça nessa ordem. Não pule etapas.** Cada uma valida que a anterior
> funcionou.

### 3.1. Criar o projeto Supabase

1. Acesse https://supabase.com/dashboard → "New project"
2. **Nome:** `malharia-bonfim-demo`
3. **Database password:** gere uma senha forte (mín. 32 chars).
   Anote em local seguro.
4. **Region:** São Paulo (mais próximo do Brasil)
5. **Plan:** Free
6. Aguarde provisionamento (~2 minutos)

Após criado, vá em **Settings → API**:

- Copie o **Project URL** (formato `https://xxxxx.supabase.co`)
- Em **Project API keys**, copie:
  - **publishable** (formato `sb_publishable_xxxxx`)
  - **secret** (formato `sb_secret_xxxxx`)

> **Importante:** se você vir apenas `anon` e `service_role`, está usando
> chaves antigas. Em **Settings → API → API Keys (new)**, ative o uso
> das novas chaves. As antigas funcionam até fim de 2026 mas estão
> deprecadas.

### 3.2. Criar repositório Git

```bash
# Na sua máquina (ou ambiente do Claude Code):
mkdir malharia-bonfim-demo && cd malharia-bonfim-demo
git init
git branch -m main
```

### 3.3. Copiar os 24 arquivos para a estrutura correta

Os arquivos estão no diretório de outputs. Estrutura final:

```
malharia-bonfim-demo/
├── README.md
├── supabase/
│   └── migrations/
│       ├── 20260514100000_initial_schema.sql
│       ├── 20260514100100_quotes_sales_simulations.sql
│       ├── 20260514100200_functions_triggers_rls.sql
│       └── 20260514100300_seed_data.sql
└── web-app/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── middleware.ts
    └── lib/
        ├── ai/
        │   ├── types.ts
        │   ├── provider.ts
        │   ├── openrouter.ts
        │   ├── openrouter-types.ts
        │   └── openrouter-mapper.ts
        ├── supabase/
        │   ├── server.ts
        │   ├── admin.ts
        │   ├── client.ts
        │   └── middleware.ts
        └── schemas/
            ├── index.ts
            ├── product.ts
            ├── conversation.ts
            ├── commerce.ts
            └── settings.ts
```

### 3.4. Inicializar Supabase localmente e fazer o link

```bash
cd malharia-bonfim-demo

# Login no CLI (abre browser)
supabase login

# Linkar com o projeto remoto
supabase link --project-ref <SEU-PROJECT-REF>
# Você acha o project-ref na URL do dashboard:
# https://supabase.com/dashboard/project/<PROJECT-REF>
# Vai pedir a senha do banco que você anotou no passo 3.1

# Validar que linkou corretamente
supabase projects list
```

### 3.5. Aplicar as migrations no Supabase

```bash
# Da raiz do projeto:
supabase db push

# Se for o primeiro push, vai aplicar as 4 migrations na ordem:
# 20260514100000_initial_schema.sql
# 20260514100100_quotes_sales_simulations.sql
# 20260514100200_functions_triggers_rls.sql
# 20260514100300_seed_data.sql
```

**Validação:** acesse o Supabase Dashboard → Table Editor. Deve ver:

- **17 tabelas criadas**
- Tabela `tenants` com 1 linha (Malharia Bonfim)
- Tabela `products` com 15 linhas (catálogo)
- Tabela `knowledge_base_chunks` com 8 linhas
- Tabela `app_settings` com 1 linha
- Todas as tabelas com cadeado fechado (RLS habilitado)

Se algo falhou, veja a seção [Problemas comuns](#8-problemas-comuns).

### 3.6. Instalar dependências do Next.js

```bash
cd web-app
npm install

# Aguardar (1-3 min). Validar:
npm run typecheck
# Deve completar sem erros.
```

### 3.7. Configurar `.env.local`

```bash
cd web-app
cp .env.example .env.local

# Editar .env.local com os valores reais:
# - NEXT_PUBLIC_SUPABASE_URL (do passo 3.1)
# - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (do passo 3.1)
# - SUPABASE_SECRET_KEY (do passo 3.1)
# - OPENROUTER_API_KEY (pegue em https://openrouter.ai/keys)
# - DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
# - Demais variáveis: deixar placeholder por enquanto se não tiver
#   Evolution/n8n/Telegram acessíveis. Não impede o app de subir.
```

### 3.8. Validar que o app sobe

```bash
npm run dev
# Abre em http://localhost:3000
```

Como ainda não temos páginas (Entrega 3), você vai ver erro 404 ou
"Page not found". **Isso é esperado nessa entrega**. O que importa
validar:

- O servidor sobe sem erros de TypeScript
- O middleware roda (você verá logs no terminal)
- Não há erro de "Variável de ambiente ausente"

---

## 4. ESTRUTURA DE ARQUIVOS COMPLETA

```
malharia-bonfim-demo/
│
├── README.md                                    [doc raiz]
│
├── supabase/
│   └── migrations/
│       ├── 20260514100000_initial_schema.sql              [180 linhas]
│       ├── 20260514100100_quotes_sales_simulations.sql    [161 linhas]
│       ├── 20260514100200_functions_triggers_rls.sql      [215 linhas]
│       └── 20260514100300_seed_data.sql                   [178 linhas]
│
└── web-app/
    ├── package.json                             [54 linhas - deps fixadas]
    ├── tsconfig.json                            [strict total]
    ├── .env.example                             [template]
    ├── middleware.ts                            [22 linhas - matcher]
    │
    └── lib/
        ├── ai/
        │   ├── types.ts                         [116 linhas]
        │   ├── provider.ts                      [94 linhas]
        │   ├── openrouter.ts                    [111 linhas]
        │   ├── openrouter-types.ts              [52 linhas]
        │   └── openrouter-mapper.ts             [136 linhas]
        │
        ├── supabase/
        │   ├── server.ts                        [43 linhas]
        │   ├── admin.ts                         [30 linhas]
        │   ├── client.ts                        [22 linhas]
        │   └── middleware.ts                    [53 linhas]
        │
        └── schemas/
            ├── index.ts                         [11 linhas - barrel]
            ├── product.ts                       [97 linhas]
            ├── conversation.ts                  [95 linhas]
            ├── commerce.ts                      [185 linhas]
            └── settings.ts                      [89 linhas]
```

**Total: 24 arquivos, ~1.892 linhas.** Todos os TS abaixo de 200 linhas
(regra do projeto). SQL de RLS passa em 215 linhas mas é boilerplate
estrutural de policies — decompor seria pior.

---

## 5. EXPLICAÇÃO DETALHADA DE CADA ARQUIVO

### 5.1. MIGRATIONS SQL

#### `supabase/migrations/20260514100000_initial_schema.sql`

**O que faz:** cria as tabelas fundacionais do sistema.

**Tabelas criadas:**

| Tabela | Função |
|---|---|
| `tenants` | Multi-tenancy raiz. Cada cliente é um tenant. Para a demo, 1 só. |
| `users` | Operadores do painel (você + atendentes). Linka com `auth.users` via `id`. |
| `app_settings` | Config por tenant: tom de voz, limites autônomos, modo apresentação. |
| `products` | Catálogo de produtos com categoria, preço base, prazo, customizações. |
| `product_variants` | Tamanhos/cores por produto. |
| `knowledge_base_chunks` | Políticas, FAQ, tom de voz — alimenta o system prompt da IA. |
| `conversations` | Uma conversa por número de contato. |
| `messages` | Turnos das conversas (inbound/outbound). |
| `processed_events` | Idempotência de webhooks. PK = event_id global. |
| `error_log` | Log centralizado de erros (alimentado pelo workflow 99 do n8n). |

**Como funciona:**

- Toda tabela tem `id UUID PK` com `DEFAULT gen_random_uuid()`,
  `created_at` e `updated_at` `TIMESTAMPTZ DEFAULT NOW()`.
- Toda tabela tem `tenant_id UUID NOT NULL REFERENCES tenants(id)`
  (multi-tenant ready).
- Foreign keys explícitas com `ON DELETE CASCADE` ou `RESTRICT`
  (nunca implícito).
- Constraints `CHECK` para invariantes de domínio
  (`base_price > 0`, `quantity > 0`, etc.).
- Índices em todas as colunas usadas em WHERE, ORDER BY ou JOIN.
- Extensões `uuid-ossp` e `pgcrypto` habilitadas no topo.

**Dependências:** primeira migration, sem dependências.

**Como verificar que aplicou:**
```sql
-- No SQL Editor do Supabase:
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Deve retornar 10 (essas 10 tabelas acima).
```

---

#### `supabase/migrations/20260514100100_quotes_sales_simulations.sql`

**O que faz:** cria as tabelas de orçamento, venda e simulações.

**Tabelas criadas:**

| Tabela | Função |
|---|---|
| `quotes` | Orçamentos gerados pela IA. Tem `quote_number` (ORC-2026-NNNN). |
| `quote_items` | Itens de cada orçamento. Snapshot do produto pra histórico estável. |
| `sales` | Vendas fechadas (quando pagamento confirma). Tem `sale_number` (VND-2026-NNNN). |
| `simulated_payments` | Pagamentos simulados (sem gateway real). Suporta Pix, cartão, boleto. |
| `simulated_calendar_events` | Agenda simulada (sem Google Calendar real). |
| `conversation_handoffs` | Log de quando a IA escalou para humano + motivo. |
| `ai_invocations` | Observabilidade leve: cada chamada LLM com modelo, tokens, latência. |

**Decisões de design importantes:**

1. **`product_name_snapshot` em `quote_items`**: copiamos o nome do
   produto na hora de gerar o orçamento. Se renomearem o produto depois,
   o histórico mantém o nome original. Padrão sólido para qualquer
   histórico financeiro.

2. **`generated_by_ai` em `quotes`**: booleano explícito. Permite filtrar
   métricas tipo "% de orçamentos pela IA" sem ambiguidade.

3. **`simulated_payments.pix_qr_code_url`**: placeholder. Gerado
   client-side por uma lib tipo `qrcode` ou só um SVG fake. Tem
   estrutura pronta pra plugar Asaas/MP real depois.

4. **`ai_invocations.provider`**: campo livre (não enum) porque podemos
   trocar entre providers sem alterar schema.

**Dependências:** depende da migration anterior (FKs para `tenants`,
`conversations`, `products`).

**Como verificar:**
```sql
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Deve agora retornar 17.
```

---

#### `supabase/migrations/20260514100200_functions_triggers_rls.sql`

**O que faz:** cria funções utilitárias, triggers de `updated_at`,
habilita RLS em todas as tabelas e cria policies.

**Componentes:**

1. **Função `update_updated_at_column()`**: trigger genérico que seta
   `NEW.updated_at = NOW()` antes de qualquer UPDATE. Aplicado em 10
   tabelas via `CREATE TRIGGER`.

2. **Função `current_tenant_id()`**:
   ```sql
   CREATE FUNCTION current_tenant_id() RETURNS UUID
   LANGUAGE sql STABLE SECURITY DEFINER
   AS $$ SELECT tenant_id FROM users WHERE id = auth.uid(); $$;
   ```
   Esta função é o **coração do RLS**. Resolve o `tenant_id` do
   usuário logado a partir do `auth.uid()`. Marcada `STABLE` para
   ser cacheável dentro de uma query (anti N+1 RLS).

3. **Funções `generate_quote_number()` e `generate_sale_number()`**:
   geram números humanizados (ORC-2026-0001, VND-2026-0001) usando
   `COUNT(*) + 1` por tenant e ano. Não usa sequence pq queremos
   reset anual e isolamento por tenant.

4. **RLS habilitado em todas as 17 tabelas** com `ENABLE ROW LEVEL
   SECURITY`.

5. **Policies criadas no padrão:**
   - `SELECT`: `USING (tenant_id = (SELECT current_tenant_id()))`
     — note o `SELECT` wrap, que cacheia o resultado por query e
     evita o trap de performance N+1 que `auth.uid()` direto causa.
   - `INSERT/UPDATE/DELETE`: `USING (false)` — bloqueia 100% de
     mutations via client. Mutations só passam via `supabaseAdmin`
     (service_role) no server.

**Casos especiais:**

- `processed_events` e `error_log` têm `USING (false)` em **toda**
  operação. São server-only end-to-end. Operador nunca lê esses logs
  pela UI (só pelo Supabase Dashboard ou query admin).
- `quote_items` tem RLS por JOIN (`EXISTS (SELECT 1 FROM quotes ...)`)
  porque não tem `tenant_id` direto. Vincula via `quote_id → quotes.tenant_id`.

**Dependências:** depende das duas migrations anteriores.

**Como verificar:**
```sql
-- Confirmar que current_tenant_id retorna algo (mesmo que NULL):
SELECT current_tenant_id();

-- Confirmar que RLS está ativo em todas as tabelas:
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
-- Coluna rowsecurity deve ser TRUE em todas.

-- Listar policies criadas:
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Deve ter ~34 policies (1 select + 1 block_writes por tabela).
```

---

#### `supabase/migrations/20260514100300_seed_data.sql`

**O que faz:** popula dados iniciais da Malharia Bonfim fictícia.

**O que insere:**

1. **1 tenant** com ID fixo `00000000-0000-0000-0000-000000000001`
   (essa UUID é referenciada em `.env.local` como `DEFAULT_TENANT_ID`).

2. **1 app_settings** com config padrão (tom acolhedor nordestino, limite
   de 50 peças por venda autônoma, desconto máximo 5%, modo apresentação
   desligado).

3. **15 produtos** distribuídos em:
   - **5 fardamento escolar:** camiseta básica, polo piquet, agasalho
     conjunto, bermuda tactel, regata educação física
   - **6 fardamento empresarial:** camiseta básica, polo piquet, camisa
     social manga longa, jaleco microfibra, avental brim, jaqueta
     helanca
   - **4 bolsas:** sacola algodão, ecobag TNT, mochila nylon 600,
     necessaire

   Cada produto tem `customization_options` em JSONB com tipos de
   customização e preço por peça (bordado R$6-11, silk R$3-7.50,
   sublimação R$8-12).

4. **8 chunks de knowledge base:**
   - Apresentação da empresa
   - Política de pagamento (Pix com 5% desc, cartão 6x sem juros, etc.)
   - Política de prazo (7-21 dias dependendo de customização)
   - Política de entrega (Caruaru retira, PE/PB/AL frete)
   - Política de troca (7 dias garantia, customização sem troca)
   - Tom de voz (acolhedor, marcadores nordestinos sem caricatura)
   - FAQ de pedido mínimo
   - FAQ de customização com logo

**O que NÃO insere ainda:**

- **Conversas, orçamentos, vendas e pagamentos históricos** —
  esses ficam num script TS separado (`scripts/seed-demo-data.ts`)
  que cria na **Entrega 2**, porque depende dos repositories e
  domain logic. Esse script gera ~80 conversas históricas, ~30
  orçamentos, ~15 vendas distribuídas em 12 meses, dando aquela
  sensação de "empresa rodando há tempos" no painel.

**Dependências:** depende das 3 migrations anteriores.

**Como verificar:**
```sql
SELECT count(*) FROM tenants;                    -- 1
SELECT count(*) FROM products;                   -- 15
SELECT count(*) FROM knowledge_base_chunks;      -- 8
SELECT count(*) FROM app_settings;               -- 1
```

---

### 5.2. CAMADA DE IA

#### `web-app/lib/ai/types.ts`

**Propósito:** tipos comuns do módulo de IA. Sem dependências de
provider específico.

**O que define:**

- **`ChatMessage`**: estrutura de uma mensagem do chat. Tem `role`
  (`system`/`user`/`assistant`/`tool`), `content`, e opcionalmente
  `toolCalls` (quando assistant chama tool) ou `toolCallId` (quando
  responde tool).

- **`ToolDefinition`**: schema que descreve uma tool. Tem `name`,
  `description` e `parameters` (JSON Schema).

- **`ChatRequest`**: input do `provider.chat()`. Inclui mensagens, tools,
  override de modelo, temperature, maxTokens, jsonMode.

- **`ChatResponse`**: output do `provider.chat()`. Inclui `content`
  (texto), `toolCalls`, `finishReason`, `usage` (tokens), `modelUsed`,
  `providerUsed`, `latencyMs`.

- **`AIError`**: classe de erro tipada com `code: AIErrorCode`
  (`rate_limit`/`auth`/`invalid_request`/`model_unavailable`/
  `timeout`/`network`/`unknown`).

**Por que existem schemas Zod nesse arquivo:**

`ChatMessageSchema`, `ChatRoleSchema`, `ChatRequestSchema`,
`ToolDefinitionSchema` são exportados como Zod schemas. Permitem que
qualquer código que recebe um `ChatRequest` de fora (por exemplo, um
endpoint do n8n) faça `ChatRequestSchema.parse(input)` para validar
em runtime.

**Como conectar:** qualquer arquivo que importa de `provider.ts` vai
acabar usando esses tipos. Não importe direto deste arquivo a não ser
que precise dos schemas Zod — use re-exports do `provider.ts`.

---

#### `web-app/lib/ai/provider.ts`

**Propósito:** define a interface `AIProvider` e a factory `getAIProvider()`.

**O que faz:**

```typescript
export interface AIProvider {
  readonly name: string
  chat(request: ChatRequest): Promise<ChatResponse>
}
```

A interface é mínima por design: um método `chat()`, um `name`. Todo
provider implementa isso.

A factory `getAIProvider()` lê `process.env.AI_PROVIDER` e instancia o
provider correspondente. Hoje só suporta `openrouter`; quando alguém
implementar `anthropic` ou `openai`, basta adicionar um `case`.

**Por que dynamic import:**

```typescript
const { OpenRouterProvider } = await import('./openrouter')
```

Em vez de `import` no topo. Isso garante que o bundle do Next só carrega
o código do provider efetivamente usado. Se você nunca chamar
`getAIProvider()` num componente client, o código do OpenRouter nem é
enviado ao browser.

**Memoização:**

```typescript
let cachedProvider: AIProvider | null = null
```

Uma única instância por processo Node. Recriar a cada chamada seria
desperdício de tempo e GC pressure.

**Como conectar:**

```typescript
// Em uma server action ou route handler:
import { getAIProvider } from '@/lib/ai/provider'

const provider = await getAIProvider()
const response = await provider.chat({
  messages: [
    { role: 'system', content: 'Você é o atendente da Malharia Bonfim...' },
    { role: 'user', content: 'Quanto custa 100 camisetas pra escola?' },
  ],
})
console.log(response.content)
```

**Dependências:** `types.ts`. Lazy-importa `openrouter.ts`.

---

#### `web-app/lib/ai/openrouter.ts`

**Propósito:** implementação concreta do `AIProvider` usando OpenRouter.

**Como funciona:**

1. Constructor recebe config (`apiKey`, `primaryModel`, `reasoningModel?`,
   `fallbackModel?`, etc.).

2. `chat()` chama `modelChain()` que retorna um array de modelos pra
   tentar em ordem:
   - `[primaryModel]` se houve override
   - `[primary, reasoning, fallback]` se default

3. Para cada modelo, chama `attempt()`. Se falhar com erro recuperável
   (`rate_limit`, `model_unavailable`, `timeout`, `network`), tenta o
   próximo. Se falhar com erro não-recuperável (`auth`,
   `invalid_request`), levanta imediatamente.

4. `attempt()`:
   - Constrói payload via `buildPayload()` do mapper
   - Faz `fetch` com timeout de 30s (via `AbortController`)
   - Em status não-2xx, levanta `AIError` com código mapeado por status
   - Parseia resposta via `parseResponse()` do mapper
   - Mede latência (Date.now() entre start e end)

**Headers enviados:**

```
Authorization: Bearer <apiKey>
Content-Type: application/json
X-Title: malharia-bonfim-demo       (aparece no dashboard OpenRouter)
HTTP-Referer: <appUrl>              (opcional, usado pelo OpenRouter
                                     para identificar de onde vem)
```

**Dependências:** `types.ts`, `provider.ts` (implementa interface),
`openrouter-types.ts`, `openrouter-mapper.ts`.

---

#### `web-app/lib/ai/openrouter-types.ts`

**Propósito:** tipos do payload do OpenRouter (formato OpenAI-compatible).

**Por que existe:** SRP. A classe `OpenRouterProvider` cuida da
orquestração e HTTP. Os tipos do vendor ficam isolados, sem poluir o
escopo da classe.

**Conteúdo:** interfaces `OpenRouterChatRequest`,
`OpenRouterChatResponse`, `OpenRouterMessage`, `OpenRouterTool`,
`OpenRouterToolCall`. Tudo TypeScript puro, sem Zod (esse formato
não é validado em runtime porque é o **nosso** payload de saída;
validamos o que recebemos como `ChatResponse`).

**Dependências:** nenhuma.

---

#### `web-app/lib/ai/openrouter-mapper.ts`

**Propósito:** tradução entre tipos do domínio (`ChatRequest`/`ChatResponse`)
e tipos do vendor (`OpenRouterChatRequest`/`Response`).

**Funções exportadas:**

| Função | O que faz |
|---|---|
| `buildPayload(request, model)` | Domínio → vendor. Constrói body para enviar pro OpenRouter. |
| `parseResponse(json, model, latencyMs)` | Vendor → domínio. Extrai `content`, `toolCalls`, `usage`, etc. da resposta. |
| `mapStatusToCode(status)` | Mapeia HTTP status → `AIErrorCode`. |
| `wrapError(err)` | Wrappa qualquer erro num `AIError` tipado. |
| `isRecoverableError(err)` | Decide se vale a pena tentar próximo modelo da chain. |

**Por que está separado da classe:** o `OpenRouterProvider` tinha 281
linhas inicialmente, acima do limite de 200 da casa. Decompusemos
seguindo SRP: classe orquestra, funções traduzem.

**Dependências:** `types.ts`, `openrouter-types.ts`.

---

### 5.3. CLIENTS SUPABASE

#### `web-app/lib/supabase/server.ts`

**Propósito:** cria um cliente Supabase para uso em **Server Components**,
**Route Handlers** e **Server Actions**.

**Como funciona:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()  // Next.js 15: cookies() é async
  return createServerClient(URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Chamado de RSC: ignora; middleware atualiza sessão.
        }
      },
    },
  })
}
```

**Pontos críticos:**

- `cookies()` é **async** no Next.js 15. Você precisa do `await`.
- `setAll` pode falhar se chamado de dentro de um RSC (Server Component
  puro, não Server Action). O try/catch é intencional. O middleware
  raiz atualiza a sessão antes de qualquer RSC rodar.
- Esse cliente usa a **publishable key**, não a secret. Mesmo no
  servidor, ele respeita RLS (porque o token de auth do usuário está
  nos cookies).

**Como conectar:**

```typescript
// Em uma Server Action:
import { createClient } from '@/lib/supabase/server'

export async function getMyProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // RLS filtra automaticamente por current_tenant_id():
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
  return { data, error }
}
```

**Dependências:** `@supabase/ssr`.

---

#### `web-app/lib/supabase/admin.ts`

**Propósito:** cliente Supabase com **service_role** (bypassa RLS).
**Server-only**.

**Como funciona:**

```typescript
import 'server-only'  // <-- IMPORTANTE: garante que browser não importa
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

**Quando usar:**

- Em **server actions** depois de validar `auth.getUser()` com o cliente
  de `server.ts`.
- Em **route handlers** que recebem webhooks (não há usuário logado,
  você confia na assinatura HMAC do vendor).
- Em **scripts de seed** ou jobs que rodam fora de request context.

**Quando NÃO usar:**

- ❌ Em Client Components. `'server-only'` vai dar erro de build —
  intencional.
- ❌ Em qualquer código que rode no browser.
- ❌ Como atalho para "evitar problemas de RLS". RLS existe pra te
  proteger.

**Padrão de uso correto:**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function createProductAction(formData: FormData) {
  // 1. Validar auth com cliente de cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Validar input com Zod
  const parsed = CreateProductInputSchema.safeParse(/* ... */)
  if (!parsed.success) return { error: 'Validation failed' }

  // 3. Mutação via admin (bypassa RLS porque já validamos)
  const { error } = await supabaseAdmin
    .from('products')
    .insert({ tenant_id: resolveTenantFor(user), ...parsed.data })

  if (error) return { error: error.message }
  return { success: true }
}
```

**Dependências:** `@supabase/supabase-js`.

---

#### `web-app/lib/supabase/client.ts`

**Propósito:** cliente Supabase para **Client Components** (browser).

**Quando usar:**

- ✅ Subscrições Realtime (`supabase.channel('...')`)
- ✅ Upload direto pro Storage (`supabase.storage.from(...)`)
- ✅ Auth flow client-side (signIn, signOut com redirect)

**Quando NÃO usar:**

- ❌ Como default. Server Components com `server.ts` é preferível.
- ❌ Para escrever em tabelas (use Server Action).

**Como usar:**

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function ConversationListener({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('new-messages')
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages',
            filter: `tenant_id=eq.${tenantId}` },
          (payload) => { /* atualiza UI */ })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId])
  return null
}
```

**Dependências:** `@supabase/ssr`.

---

#### `web-app/lib/supabase/middleware.ts`

**Propósito:** lógica de refresh de sessão executada pelo `middleware.ts`
raiz.

**O que faz:**

1. Pega cookies do request.
2. Cria cliente Supabase configurado para escrever cookies em resposta.
3. Chama `supabase.auth.getUser()` — força refresh da sessão se token
   está expirando.
4. Se usuário **não autenticado** e a rota **não é pública**, redireciona
   para `/login`.
5. Se usuário autenticado ou rota pública, retorna `NextResponse.next()`
   com cookies atualizados.

**Rotas públicas (não exigem auth):**

```typescript
const ROUTES_PUBLIC = ['/login', '/auth/callback', '/auth/error']
```

**Por que isso importa:** sem esse middleware, sessão pode expirar e o
usuário vê erros estranhos no meio do uso. Aqui garantimos que toda
request começa com sessão válida ou redirect limpo.

**Dependências:** `@supabase/ssr`, `next/server`.

---

### 5.4. SCHEMAS ZOD

#### `web-app/lib/schemas/product.ts`

**Propósito:** schemas de Produto, Variante e tipos relacionados.

**O que define:**

- `ProductCategorySchema` (enum): `fardamento_escolar`,
  `fardamento_empresarial`, `bolsas`.
- `PRODUCT_CATEGORY_LABELS`: mapa de enum → label legível em PT-BR.
- `CustomizationTypeSchema` (enum): `bordado`, `silk`, `sublimacao`, etc.
- `CustomizationOptionSchema`: objeto com `type`, `label`,
  `price_per_piece`.
- `ProductSchema`: schema completo da tabela `products`. Todos os
  campos refletem o SQL: `tenant_id`, `sku`, `name`, `category`,
  `description`, `base_price`, `production_days_min/max`,
  `minimum_order_qty`, `customization_options` (array), `image_url`,
  `active`, `created_at`, `updated_at`.
- `CreateProductInputSchema`: derivado de `ProductSchema` via `.omit()`
  + `.partial()` + `.refine()` para invariante `max >= min`.
- `ProductVariantSchema`: tamanho/cor/ajuste de preço.

**Por que tipo TS derivado:**

```typescript
export type Product = z.infer<typeof ProductSchema>
```

Single source of truth. Mudar o schema atualiza automaticamente o tipo.
Nunca declare `type Product = { ... }` manual quando tem o Zod.

**Como conectar:**

```typescript
import { ProductSchema, type Product } from '@/lib/schemas'

const parsed = ProductSchema.safeParse(rowFromDB)
if (parsed.success) {
  const product: Product = parsed.data  // narrow
}
```

---

#### `web-app/lib/schemas/conversation.ts`

**Propósito:** schemas de Conversa, Mensagem e Handoff.

**O que define:**

- `ConversationStatusSchema`: `active`, `closed`, `handoff`.
- `ConversationSchema`: tabela `conversations`.
- `MessageDirectionSchema`: `inbound`, `outbound`.
- `MessageSenderSchema`: `contact`, `ai`, `human_agent`.
- `MessageSchema`: tabela `messages`.
- `CreateInboundMessageInputSchema`: input de webhook (Evolution).
  Inclui `external_event_id` obrigatório para idempotência.
- `HandoffReasonSchema`: enum dos 6 motivos de handoff.
- `HANDOFF_REASON_LABELS`: mapa enum → label PT-BR.
- `ConversationHandoffSchema`: tabela `conversation_handoffs`.

**Conexão crítica:** o workflow n8n que recebe mensagem do Evolution
**deve** validar payload com `CreateInboundMessageInputSchema` antes de
salvar. Garante que `external_event_id` está presente — sem ele,
idempotência quebra.

---

#### `web-app/lib/schemas/commerce.ts`

**Propósito:** schemas de Orçamento, Venda, Pagamento e Agenda.

**O que define:**

- `QuoteStatusSchema` + `QUOTE_STATUS_LABELS`
- `QuoteSchema`, `QuoteItemSchema`, `QuoteWithItemsSchema` (com items
  aninhados)
- `GenerateQuoteInputSchema`: input do tool call da IA. A IA passa
  `conversation_id`, lista de itens com produto/qtd/customização, e
  `discount_pct`. Domain logic valida limites antes de criar.
- `SaleStatusSchema`, `SaleSchema`
- `PaymentMethodSchema`: `pix`, `cartao_credito`, `boleto`
- `PaymentStatusSchema`: `pending`, `paid`, `expired`, `refunded`
- `SimulatedPaymentSchema`
- `MeetingTypeSchema`: `presencial`, `video`, `telefone`
- `CalendarEventStatusSchema`
- `SimulatedCalendarEventSchema`
- `ScheduleMeetingInputSchema`: input do tool call de agendamento.

**Observação:** `QuoteWithItemsSchema = QuoteSchema.extend({ items: ... })`.
Útil quando você faz select com join e quer validar a estrutura completa.

---

#### `web-app/lib/schemas/settings.ts`

**Propósito:** schemas de Knowledge Base, App Settings e User.

**O que define:**

- `KnowledgeCategorySchema`: 7 categorias.
- `KnowledgeBaseChunkSchema`: tabela `knowledge_base_chunks`.
- `BusinessHoursSchema`: objeto com 7 dias da semana.
- `AppSettingsSchema`: tabela `app_settings`.
- `UserRoleSchema`: `owner`, `agent`.
- `UserSchema`: tabela `users`.

**Notas:**

- `BusinessHoursSchema` espera strings tipo `"08:00-18:00"` ou `"closed"`.
  Parser de horários (transformar em datas para validar se "agora é
  horário comercial") fica em `lib/domain/business-hours.ts` na Entrega 2.

---

#### `web-app/lib/schemas/index.ts`

**Propósito:** barrel export. Único ponto de entrada para schemas.

```typescript
export * from './product'
export * from './conversation'
export * from './commerce'
export * from './settings'
```

**Por que existe:** importar de `@/lib/schemas` é mais limpo que importar
de `@/lib/schemas/product`, `@/lib/schemas/conversation`, etc. em todo
arquivo que usa múltiplos schemas.

---

### 5.5. MIDDLEWARE RAIZ

#### `web-app/middleware.ts`

**Propósito:** registra o middleware do Next.js que roda em **toda**
request (com exceções).

**O que faz:**

```typescript
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)',
  ],
}
```

**Matcher explicado:**

A regex `(?!...)` é negative lookahead. Roda o middleware em **toda**
rota **exceto**:
- `/_next/static`, `/_next/image` (assets do Next)
- `/favicon.ico`
- `/manifest.json` (PWA manifest)
- `/sw.js` (service worker)
- Qualquer arquivo `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.ico`

Razão: esses são arquivos públicos sem auth. Rodar middleware neles
adiciona latência desnecessária.

**Dependências:** `lib/supabase/middleware.ts`.

---

### 5.6. CONFIGURAÇÃO

#### `web-app/package.json`

**Propósito:** declarar dependências e scripts npm.

**Scripts disponíveis:**

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe Next.js em modo dev na porta 3000 |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build em produção |
| `npm run lint` | ESLint check |
| `npm run typecheck` | `tsc --noEmit` (valida tipos sem gerar arquivos) |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run db:push` | `supabase db push` (aplica migrations) |
| `npm run db:reset` | `supabase db reset` (recria DB do zero) |
| `npm run seed:demo` | Roda script TS de seed de demo data (Entrega 2) |

**Dependências críticas (com versões alvo):**

| Pacote | Versão | Para que serve |
|---|---|---|
| `next` | 15.1+ | Framework |
| `react` / `react-dom` | 19+ | Necessário pelo Next 15 |
| `@supabase/ssr` | 0.5+ | Helpers SSR pro Supabase |
| `@supabase/supabase-js` | 2.47+ | Client base |
| `zod` | 3.24+ | Validação runtime |
| `react-hook-form` | 7.54+ | Forms |
| `@hookform/resolvers` | 3.9+ | Adapter Zod ↔ RHF |
| `@tanstack/react-table` | 8.20+ | Tabelas headless |
| `recharts` | 2.15+ | Gráficos (dashboard) |
| `lucide-react` | 0.469+ | Ícones |
| `tailwindcss` | 4.0+ | Estilo (v4 com PostCSS) |
| `tailwind-merge` | 2.6+ | Merge de classes Tailwind |
| `class-variance-authority` | 0.7+ | CVA pra shadcn |
| `next-themes` | 0.4+ | Dark mode |
| `serwist` + `@serwist/next` | 9+ | PWA |
| `sonner` | 1.7+ | Toast notifications |
| `date-fns` | 4.1+ | Manipulação de datas |

**Sobre `engines.node`:**
```json
"engines": { "node": ">=20.0.0" }
```
Next 15 exige Node 18.18+, mas usamos 20 LTS por estabilidade.

---

#### `web-app/tsconfig.json`

**Propósito:** configuração TypeScript em **strict total**.

**Flags ativadas:**

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

**Path alias:**

```json
"paths": { "@/*": ["./*"] }
```

Permite `import { foo } from '@/lib/schemas'` em vez de
`'../../../lib/schemas'`.

---

#### `web-app/.env.example`

**Propósito:** template de variáveis de ambiente. Copie para `.env.local`
e preencha.

**Grupos:**

1. **Supabase** (URL + publishable + secret)
2. **IA** (provider + chaves OpenRouter + modelos)
3. **Evolution API** (URL + token + instance name)
4. **n8n** (URL + webhook secret)
5. **Telegram** (bot token + chat id)
6. **Tenant default** (UUID fixo `00000000-0000-0000-0000-000000000001`)

**Importante:**

- Nunca commitar `.env.local`. O `.gitignore` (criar) deve incluir.
- Vars com prefixo `NEXT_PUBLIC_` são expostas ao client. Use só pra
  o que **deve** ser público (URL do Supabase, publishable key).
- `SUPABASE_SECRET_KEY` **nunca** com prefixo `NEXT_PUBLIC_`. Vazaria
  no bundle do browser.

---

## 6. SEQUÊNCIA DE EXECUÇÃO RECOMENDADA

Faça nessa ordem. Cada passo depende dos anteriores.

```
[1] Criar conta Supabase + projeto      → 3.1
[2] Inicializar Git local                → 3.2
[3] Copiar 24 arquivos pra estrutura     → 3.3
[4] supabase login + link                → 3.4
[5] supabase db push (4 migrations)      → 3.5
[6] cd web-app && npm install            → 3.6
[7] cp .env.example .env.local + editar  → 3.7
[8] npm run typecheck (deve passar)      → validação
[9] npm run dev (deve subir)             → 3.8
[10] Validar smoke tests                  → Seção 7
[11] git add . && git commit              → versionar
[12] git remote add origin <repo>         → push
```

---

## 7. CRITÉRIOS DE SUCESSO

Esta entrega está **completa e válida** quando todos os itens abaixo
passam:

### Banco de dados

- [ ] `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'` retorna **17**.
- [ ] `SELECT count(*) FROM tenants` retorna **1**.
- [ ] `SELECT count(*) FROM products` retorna **15**.
- [ ] `SELECT count(*) FROM knowledge_base_chunks` retorna **8**.
- [ ] `SELECT count(*) FROM app_settings` retorna **1**.
- [ ] `SELECT count(*) FROM pg_policies WHERE schemaname = 'public'` retorna **>= 30**.
- [ ] Todas as 17 tabelas têm `rowsecurity = true` em `pg_tables`.
- [ ] `SELECT current_tenant_id()` executa sem erro (retorna NULL se sem sessão, OK).

### Code

- [ ] `npm install` completou sem erros.
- [ ] `npm run typecheck` passa sem erros.
- [ ] `npm run dev` sobe sem erros no console.
- [ ] Acessar `http://localhost:3000` retorna 404 (esperado — sem páginas
      ainda) **sem** mensagens de erro de variável de ambiente.

### Estrutura

- [ ] Arquivos `.env.local` **NÃO** está commitado no Git.
- [ ] Arquivo `.env.example` **está** commitado.
- [ ] `node_modules/` está no `.gitignore`.
- [ ] Os 24 arquivos estão exatamente nas paths descritas em
      [Seção 4](#4-estrutura-de-arquivos-completa).

### Smoke test de IA

Execute esse script de teste manual em um arquivo temporário
`scripts/smoke-test-ai.ts`:

```typescript
import 'dotenv/config'
import { getAIProvider } from '../web-app/lib/ai/provider'

async function main() {
  const provider = await getAIProvider()
  console.log('Provider name:', provider.name)
  const response = await provider.chat({
    messages: [{ role: 'user', content: 'Diga apenas "ok" e nada mais.' }],
    maxTokens: 10,
  })
  console.log('Response:', response.content)
  console.log('Model used:', response.modelUsed)
  console.log('Latency:', response.latencyMs, 'ms')
  console.log('Tokens:', response.usage)
}
main().catch(console.error)
```

Rode com:
```bash
cd web-app && npx tsx ../scripts/smoke-test-ai.ts
```

Esperado:
- Imprime "Provider name: openrouter"
- Imprime "Response: ok" (ou similar)
- Imprime "Model used: meta-llama/llama-3.3-70b-instruct:free" (ou
  o que estiver em `OPENROUTER_PRIMARY_MODEL`)
- Imprime latência e tokens

Se isso passar, a camada de IA está **funcionando ponta-a-ponta**.

---

## 8. PROBLEMAS COMUNS

### "Cannot find module '@/lib/...'"

**Causa:** path alias do tsconfig não está resolvendo. **Solução:**
verifique se o `tsconfig.json` está na raiz de `web-app/` e tem
`"paths": { "@/*": ["./*"] }`. Reinicie o TS server do editor.

### `supabase db push` falha com "permission denied"

**Causa:** projeto não foi linkado. **Solução:**
```bash
supabase link --project-ref <ref>
# Inserir a senha do banco que você anotou.
```

### Migration falha com "function gen_random_uuid() does not exist"

**Causa:** extensão `pgcrypto` não habilitada. **Solução:** a primeira
migration já tem `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`. Se não
rodou, rode manualmente no SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### "Variável de ambiente ausente: NEXT_PUBLIC_SUPABASE_URL"

**Causa:** `.env.local` não criado ou variável ausente. **Solução:**
```bash
cp .env.example .env.local
# editar com valores reais
```
Reinicie o dev server depois (`Ctrl+C` e `npm run dev` de novo).

### OpenRouter retorna 401 Unauthorized

**Causa:** `OPENROUTER_API_KEY` inválida ou ausente. **Solução:**
verifique em https://openrouter.ai/keys que a chave existe e está ativa.

### OpenRouter retorna 429 sempre

**Causa:** rate limit de free tier excedido (200 req/dia/modelo).
**Solução:** aguardar reset (00:00 UTC) ou trocar `OPENROUTER_PRIMARY_MODEL`
para outro modelo gratuito. O fallback automático já deveria ter tratado;
se persistir, verifique se `OPENROUTER_FALLBACK=openrouter/free` está
setado.

### TypeScript reclama de "X possibly undefined"

**Causa:** strict null checks ativos. Isso é **bom**, não desabilite.
**Solução:** trate o caso null/undefined com:
- Optional chaining: `obj?.prop`
- Nullish coalescing: `obj?.prop ?? 'default'`
- Type guard: `if (!obj) return; obj.prop`

---

## 9. O QUE VEM DEPOIS

### Entrega 2 — Domínio e Servidor

- `lib/domain/quote-calculator.ts` — cálculo puro de orçamento (preço,
  customização, desconto, limites autônomos). Sem dependência de
  Supabase. Testável com Vitest unitário.
- `lib/domain/handoff-rules.ts` — detecção de emergência (regex pra
  xingamento, comparação com limites, etc.).
- `lib/domain/business-hours.ts` — parser de horário comercial.
- `lib/repositories/` — data access layer. Uma classe por agregado
  (`ProductsRepository`, `ConversationsRepository`, etc.). Constructor
  recebe `SupabaseClient`. Métodos retornam tipos validados via Zod.
- `app/(dashboard)/products/actions.ts` e outras server actions.
- `app/api/n8n-callback/route.ts` — endpoint chamado pelos workflows
  n8n para callbacks pós-execução de tool.
- `scripts/seed-demo-data.ts` — gerador de 80 conversas históricas, 30
  orçamentos, 15 vendas distribuídas em 12 meses.
- Testes Vitest de `lib/domain` com coverage > 80%.

### Entrega 3 — Frontend e PWA

- `app/(auth)/login/page.tsx` — tela de login.
- `app/(dashboard)/layout.tsx` — shell com sidebar + header.
- `app/(dashboard)/page.tsx` — dashboard com KPIs (faturamento mês,
  taxa de resolução IA, conversões, ticket médio).
- `app/(dashboard)/conversations/` — lista + detalhe de conversas com
  histórico de mensagens.
- `app/(dashboard)/quotes/` — lista de orçamentos.
- `app/(dashboard)/catalog/` — CRUD de produtos.
- `app/(dashboard)/calendar/` — agenda visual.
- `app/(dashboard)/payments/` — pagamentos simulados.
- `app/(dashboard)/knowledge-base/` — editor.
- `app/(dashboard)/settings/` — config.
- Toggle Modo Apresentação.
- Setup Serwist (PWA) + manifest.json + ícones.
- `next.config.js` com headers de segurança.
- Tema dark/light via `next-themes`.

### Entrega 4 — Workflows n8n (via MCP)

- Workflow 01 `whatsapp-inbound` (webhook Evolution)
- Workflow 02 `agent-orchestrator` (Single Agent w/ State)
- Workflow 03 `tool-quote-generator`
- Workflow 04 `tool-calendar-simulator`
- Workflow 05 `tool-payment-simulator`
- Workflow 06 `tool-handoff`
- Workflow 07 `outbound-message`
- Workflow 99 `error-handler`

---

## ANEXO: Comandos úteis durante o desenvolvimento

```bash
# Recriar banco do zero (cuidado, apaga tudo)
supabase db reset

# Ver SQL que será aplicado no próximo push
supabase db diff

# Gerar tipos TypeScript a partir do schema do banco
supabase gen types typescript --linked > web-app/lib/supabase/database.types.ts
# (não estritamente necessário — temos Zod schemas — mas pode ajudar
#  em queries select específicas)

# Validar tipos sem rodar build
cd web-app && npm run typecheck

# Build de produção local
cd web-app && npm run build && npm run start

# Reverter última migration (se necessário)
# Não há comando automático — criar nova migration de undo manualmente.
```

---

**FIM DO HANDOFF DA ENTREGA 1.**

Se você (Claude Code) completou todos os critérios de sucesso da
Seção 7, está pronto para receber o handoff da Entrega 2.

Em caso de bloqueio, reporte ao operador (Matteus) qual passo falhou
e qual erro apareceu. Não improvise estrutura ou nomes — siga
exatamente o que está documentado aqui.
