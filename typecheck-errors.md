# Relatório de erros de TypeScript — Bloco 3

**Projeto:** malharia-bonfim-demo
**Data:** 2026-05-15
**Comando:** `npm run typecheck` (`tsc --noEmit`)
**Resultado:** ❌ falhou com **21 erros em 8 arquivos**

## Resumo executivo

O bundle do **Bloco 3 (painel web)** referencia em vários pontos
valores de enum que **não existem** nos schemas Zod entregues na
**Entrega 1**. É drift de schema entre as duas entregas, não bug de
versão de pacote.

Há também 3 problemas menores não relacionados a drift:
parâmetros sem tipo explícito (`any` implícito), conversão de tipo
agressiva em repository, e um `Date` sendo passado onde o atributo
HTML espera `string`.

---

## Grupo A — Drift de enum (drift entre Entrega 1 e Bloco 3)

São os mais impactantes. O componente referencia uma chave que o
schema não conhece.

### A1. `components/status-badges.tsx:28` — `'failed'` não existe em PaymentStatus

**Schema vigente (`lib/schemas/commerce.ts:124`):**
```ts
PaymentStatusSchema = z.enum(['pending', 'paid', 'expired', 'refunded'])
```

**Código do bundle (`components/status-badges.tsx:25-31`):**
```ts
const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label; variant }> = {
  pending: { label: 'Aguardando', variant: 'warning' },
  paid:    { label: 'Pago',       variant: 'success' },
  failed:  { label: 'Falhou',     variant: 'destructive' },  // <-- não existe no enum
  expired: { label: 'Expirado',   variant: 'secondary' },
  refunded:{ label: 'Estornado',  variant: 'outline' },
}
```

**Erro:** `TS2353: Object literal may only specify known properties,
and 'failed' does not exist in type 'Record<"expired" | "paid" |
"pending" | "refunded", ...>'`.

**Resolução possível:**
- Adicionar `'failed'` em `PaymentStatusSchema` (e na constraint CHECK
  da migration `simulated_payments.status`) → ou
- Remover a linha `failed` do mapa do bundle.

---

### A2. `components/status-badges.tsx:53` — `'resolved'` e `'spam'` não existem em ConversationStatus

**Schema vigente (`lib/schemas/conversation.ts:11`):**
```ts
ConversationStatusSchema = z.enum(['active', 'closed', 'handoff'])
```

**Código do bundle (`components/status-badges.tsx:50-55`):**
```ts
const CONV_STATUS_MAP: Record<ConversationStatus, ...> = {
  active:   { label: 'Ativa', ... },
  handoff:  { label: 'Aguardando humano', ... },
  resolved: { label: 'Resolvida', ... },  // <-- não existe (schema usa 'closed')
  spam:     { label: 'Spam',      ... },  // <-- não existe
}
```

**Erro:** `TS2353: Object literal may only specify known properties,
and 'resolved' does not exist in type 'Record<"active" | "closed" |
"handoff", ...>'`.

**Observação:** o bundle nunca menciona `'closed'`, sugerindo que o
autor renomeou o status mas não atualizou o schema. Decida com o
arquiteto: o termo correto é `closed` ou `resolved`?

---

### A3. `app/(dashboard)/conversations/page.tsx:14` — `'resolved'` no filtro de conversas

**Mesmo problema do A2.** O array de filtros usa `'resolved'`:

```ts
const STATUS_FILTERS: { value: ConversationStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'Todas' },
  { value: 'active',   label: 'Ativas' },
  { value: 'handoff',  label: 'Aguardando humano' },
  { value: 'resolved', label: 'Resolvidas' },  // <-- não existe
]
```

**Erro:** `TS2322: Type '"resolved"' is not assignable to type
'"active" | "closed" | "handoff" | "all"'`.

---

### A4. `app/(dashboard)/knowledge-base/page.tsx:11,18` — `'catalog'`, `'policies'`, `'identity'`, `'scripts'` não existem em KnowledgeCategory

**Schema vigente (`lib/schemas/settings.ts:11-19`):**
```ts
KnowledgeCategorySchema = z.enum([
  'politica_pagamento',
  'politica_prazo',
  'politica_entrega',
  'politica_troca',
  'faq',
  'tom_de_voz',
  'sobre_empresa',
])
```

**Código do bundle (`app/(dashboard)/knowledge-base/page.tsx:10-22`):**
```ts
const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  catalog:  'Catálogo',     // <-- não existe
  policies: 'Políticas',    // <-- não existe (schema tem 4 politica_*)
  identity: 'Identidade',   // <-- não existe
  scripts:  'Roteiros',     // <-- não existe
}
const CATEGORY_DESCRIPTIONS: Record<KnowledgeCategory, string> = {
  catalog:  'Informações de produtos e customizações',
  policies: 'Pagamento, prazo, entrega, troca',
  identity: 'Quem é a empresa, valores, história',
  scripts:  'Modelos de resposta para situações específicas',
}
```

**Erros:**
- `TS2353: 'catalog' does not exist in type 'Record<...>'` (×2)
- `TS2532: Object is possibly 'undefined'` (linha 29 do reduce — fallthrough)

**Observação:** o bundle agrupa em 4 categorias coarsas; o schema
mantém 7 categorias finas. Decida com o arquiteto: agrupar via mapa
no UI ou expandir o enum? **Impacto runtime: esta página vai
crashar** com `Cannot read properties of undefined` ao tentar
renderizar as 8 chunks seedadas, que usam as categorias finas.

---

### A5. `app/(dashboard)/calendar/page.tsx:77,84,87,90,92` — `event_type`, `location`, `description` não existem em SimulatedCalendarEvent

**Schema vigente (`lib/schemas/commerce.ts:158-173`):**
```ts
SimulatedCalendarEventSchema = z.object({
  id, tenant_id, conversation_id,
  contact_name, contact_phone,
  title, scheduled_for, duration_minutes,
  meeting_type: z.enum(['presencial', 'video', 'telefone']),  // <-- não é 'event_type'
  status, notes,
  created_at, updated_at,
})
```

**Código do bundle (`app/(dashboard)/calendar/page.tsx:8-13, 77-93`):**
```ts
const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting:               'Reunião',
  delivery:              'Entrega',
  production_milestone:  'Marco de produção',
  follow_up:             'Follow-up',
}

// no JSX:
{EVENT_TYPE_LABELS[evt.event_type] ?? evt.event_type}  // <-- usa event_type
{evt.location && <div>{evt.location}</div>}             // <-- usa location
{evt.description && <p>{evt.description}</p>}           // <-- usa description
```

**Erros (TS2339 ×6):** `Property 'event_type' does not exist`,
`Property 'location' does not exist`, `Property 'description' does
not exist`.

**Observação:** o autor parece ter desenhado um modelo de calendar
event mais rico (com tipos meeting/delivery/follow_up e campos
location/description) que **não foi entregue no schema**. Decida
com o arquiteto:
- (a) expandir `SimulatedCalendarEventSchema` (adicionar
  `event_type`, `location`, `description`) e a migration; ou
- (b) reduzir o componente a usar apenas `meeting_type`, `notes` e
  o que o schema já tem.

---

## Grupo B — Problemas locais (não dependem do schema)

### B1. `components/conversation-bubble.tsx:62` — Date vs string em `<time dateTime>`

```tsx
<time dateTime={message.created_at}>...</time>
```

`message.created_at` é `Date` (via `z.coerce.date()`); o atributo
HTML `dateTime` espera `string`.

**Erro:** `TS2322: Type 'Date' is not assignable to type 'string'`.

**Fix mecânico:** `dateTime={message.created_at.toISOString()}`.

---

### B2. `lib/repositories/dashboard.ts:141` — cast agressivo entre formatos incompatíveis

```ts
const result = data as { /* shape muito diferente do retorno real */ }
```

O TS está reclamando que o select do Supabase devolve `products` como
**array** (`{ category }[]`) mas o cast diz que é objeto single
(`{ category } | null`).

**Erro:** `TS2352: Conversion of type ... may be a mistake because
neither type sufficiently overlaps`.

**Fix:** ou cast via `unknown` (`as unknown as ...`), ou ajustar a
shape do query (usar `.single()`), ou tipar com `products[0]?.category`.

---

### B3. `lib/supabase/middleware.ts:24` e `lib/supabase/server.ts:25` — parâmetro implicitamente `any`

```ts
setAll(cookiesToSet) { ... }   // <-- TS strict reclama
```

**Erro:** `TS7006: Parameter 'cookiesToSet' implicitly has an 'any'
type`.

**Fix:** anotar
`cookiesToSet: { name: string; value: string; options: CookieOptions }[]`
ou usar o tipo do `@supabase/ssr` (`CookieOptionsWithName`).

---

### B4. `lib/utils.ts:62-63` — array index sem checagem de undefined

```ts
const parts = name.trim().split(/\s+/)
if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
```

Com `noUncheckedIndexedAccess` (parte do strict), `parts[0]` é
`string | undefined`.

**Erros:** `TS2532: Object is possibly 'undefined'` (×5).

**Fix:** `if (parts.length === 0 || !parts[0]) return '?'` e
extrair em variáveis garantidas.

---

## Lista completa, na ordem do tsc

```
app/(dashboard)/calendar/page.tsx(77,50): TS2339   event_type não existe
app/(dashboard)/calendar/page.tsx(77,69): TS2339   event_type não existe
app/(dashboard)/calendar/page.tsx(84,30): TS2339   location não existe
app/(dashboard)/calendar/page.tsx(87,34): TS2339   location não existe
app/(dashboard)/calendar/page.tsx(90,30): TS2339   description não existe
app/(dashboard)/calendar/page.tsx(92,34): TS2339   description não existe
app/(dashboard)/conversations/page.tsx(14,5): TS2322   'resolved' fora do enum
app/(dashboard)/knowledge-base/page.tsx(11,3): TS2353   'catalog' fora do enum
app/(dashboard)/knowledge-base/page.tsx(18,3): TS2353   'catalog' fora do enum (×2 entradas)
app/(dashboard)/knowledge-base/page.tsx(29,5): TS2532   acc[c.category] pode ser undefined
components/conversation-bubble.tsx(62,17): TS2322   Date passada onde espera string
components/status-badges.tsx(28,3): TS2353   'failed' fora do enum PaymentStatus
components/status-badges.tsx(53,3): TS2353   'resolved' fora do enum ConversationStatus
lib/repositories/dashboard.ts(141,17): TS2352   conversão agressiva sem overlap
lib/supabase/middleware.ts(24,16): TS7006   cookiesToSet sem tipo
lib/supabase/server.ts(25,16): TS7006   cookiesToSet sem tipo
lib/utils.ts(62,34): TS2532   parts[0] pode ser undefined
lib/utils.ts(63,11): TS2532   parts[0] pode ser undefined (×2)
lib/utils.ts(63,25): TS2532   parts[parts.length-1] pode ser undefined (×2)
```

Total: **21 erros**, **8 arquivos**, **5 grupos** (A1–A5) +
**4 problemas locais** (B1–B4).

---

## Impacto em runtime (`npm run dev`)

`next dev` **não enforça** typecheck — roda mesmo com esses erros.
Comportamento esperado em cada página:

| Página | Estado |
|---|---|
| `/login` | ✅ Renderiza |
| `/` (dashboard) | ✅ Renderiza (KPIs zerados sem demo data) |
| `/conversations` | ✅ Renderiza, mas filtro "Resolvidas" não filtra nada (passa string desconhecida pro repository) |
| `/conversations/[id]` | ⚠️ Pode mostrar `dateTime="[object Object]"` no atributo time |
| `/quotes` | ✅ Renderiza |
| `/quotes/[id]` | ✅ Renderiza |
| `/catalog` | ✅ 15 produtos do seed |
| `/calendar` | ✅ Vazio → renderiza. Com dados → **runtime error** (`evt.event_type` undefined em LABELS lookup; o `??` segura, mas `evt.location && ...` é OK porque undefined é falsy) |
| `/payments` | ✅ Vazio → renderiza |
| `/knowledge-base` | ❌ **Crash certo.** As 8 chunks seedadas usam `politica_pagamento`, `politica_prazo` etc; `CATEGORY_LABELS[c.category]` retorna `undefined`. Renderiza mas com label literal `undefined` ou cai no fallback. **Mais crítico:** `CATEGORY_DESCRIPTIONS[c.category]` na linha 61 retorna undefined → React tenta renderizar `{undefined}` (OK, vira nada). Não vai *crashar*, mas vai mostrar UI quebrada (sem labels). |
| `/settings` | ✅ Renderiza |

**Correção da minha avaliação anterior:** o impacto é menor do que
imaginei. Apenas o `/calendar` com dados de teste teria comportamento
estranho. Sem demo data, **o painel inteiro deve subir e navegar**.

---

## Próximos passos sugeridos

1. **Curto prazo — destravar a demo:** rodar `npm run dev` sem fixar
   nada. Validar visualmente as 8 áreas (todas vazias, exceto catálogo
   e KB que têm seed). Aceitar que KB mostra cards sem label de
   categoria. (~5 min)

2. **Médio prazo — fixes cirúrgicos antes da apresentação:** ajustar
   os 5 grupos A para casarem com o schema vigente. Decisões:
   - A1: adicionar `failed` ou remover? Sugiro **remover** — o
     fluxo de pagamento simulado não tem motivo pra "falhar".
   - A2/A3: usar `closed` em vez de `resolved`? Renomear no schema?
   - A4: expandir KB enum pra 4 categorias coarsas ou agrupar via
     mapa? Sugiro **manter 7 finas e fazer mapa de display no UI**.
   - A5: adicionar `event_type/location/description` ao schema +
     migration ou reduzir o componente? Sugiro **adicionar** — esses
     campos fazem sentido pra demo.

3. **Longo prazo:** reportar ao arquiteto pra entregar Bloco 3
   atualizado com schema corrigido.

---

**Arquivo bruto do `tsc`:** `typecheck-errors.txt` (mesma pasta).
