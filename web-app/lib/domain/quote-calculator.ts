/**
 * Quote Calculator — lógica de domínio pura.
 *
 * SEM dependência de Supabase, Next.js ou qualquer framework. Testável
 * com Vitest unitário em ms.
 *
 * Princípio: domain logic não conhece persistência. Recebe inputs
 * tipados, valida invariantes, retorna outputs tipados ou Error.
 */

import type { CustomizationOption, Product } from '@/lib/schemas'

export interface QuoteLineInput {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'base_price' | 'minimum_order_qty' | 'production_days_max'>
  quantity: number
  variant_size?: string
  variant_color?: string
  customization?: CustomizationOption[]
}

export interface QuoteLineResult {
  product_id: string
  product_name: string
  variant_size: string | null
  variant_color: string | null
  quantity: number
  unit_price: number
  customization_total: number
  subtotal: number
}

export interface QuoteCalculationResult {
  lines: QuoteLineResult[]
  subtotal: number
  discount: number
  discount_pct: number
  total: number
  production_days: number
}

export type QuoteCalculationError =
  | { code: 'BELOW_MINIMUM'; product_sku: string; min: number; given: number }
  | { code: 'INVALID_QUANTITY'; product_sku: string }
  | { code: 'DISCOUNT_EXCEEDS_LIMIT'; given_pct: number; max_pct: number }
  | { code: 'AUTONOMOUS_LIMIT_EXCEEDED'; total_pieces: number; max_pieces: number }
  | { code: 'EMPTY_QUOTE' }

export interface QuoteCalculationOptions {
  discount_pct?: number
  autonomousLimits?: {
    max_pieces: number
    max_discount_pct: number
  }
}

export type QuoteCalculationOutcome =
  | { ok: true; result: QuoteCalculationResult }
  | { ok: false; error: QuoteCalculationError }

/**
 * Calcula orçamento a partir das linhas + opções.
 * Retorna QuoteCalculationOutcome (discriminated union) — nunca throws.
 */
export function calculateQuote(
  lines: QuoteLineInput[],
  options: QuoteCalculationOptions = {}
): QuoteCalculationOutcome {
  if (lines.length === 0) return { ok: false, error: { code: 'EMPTY_QUOTE' } }

  const computed: QuoteLineResult[] = []
  let totalPieces = 0
  let maxProductionDays = 0

  for (const line of lines) {
    if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
      return { ok: false, error: { code: 'INVALID_QUANTITY', product_sku: line.product.sku } }
    }
    if (line.quantity < line.product.minimum_order_qty) {
      return {
        ok: false,
        error: {
          code: 'BELOW_MINIMUM',
          product_sku: line.product.sku,
          min: line.product.minimum_order_qty,
          given: line.quantity,
        },
      }
    }

    const customizationTotal = (line.customization ?? []).reduce(
      (sum, c) => sum + c.price_per_piece * line.quantity,
      0
    )
    const unitTotal =
      line.product.base_price +
      (line.customization ?? []).reduce((sum, c) => sum + c.price_per_piece, 0)
    const subtotal = round2(unitTotal * line.quantity)

    computed.push({
      product_id: line.product.id,
      product_name: line.product.name,
      variant_size: line.variant_size ?? null,
      variant_color: line.variant_color ?? null,
      quantity: line.quantity,
      unit_price: line.product.base_price,
      customization_total: round2(customizationTotal),
      subtotal,
    })
    totalPieces += line.quantity
    maxProductionDays = Math.max(maxProductionDays, line.product.production_days_max)
  }

  const discountPct = options.discount_pct ?? 0
  const limits = options.autonomousLimits

  if (limits && totalPieces > limits.max_pieces) {
    return {
      ok: false,
      error: {
        code: 'AUTONOMOUS_LIMIT_EXCEEDED',
        total_pieces: totalPieces,
        max_pieces: limits.max_pieces,
      },
    }
  }
  if (limits && discountPct > limits.max_discount_pct) {
    return {
      ok: false,
      error: {
        code: 'DISCOUNT_EXCEEDS_LIMIT',
        given_pct: discountPct,
        max_pct: limits.max_discount_pct,
      },
    }
  }

  const subtotal = round2(computed.reduce((sum, l) => sum + l.subtotal, 0))
  const discount = round2((subtotal * discountPct) / 100)
  const total = round2(subtotal - discount)

  return {
    ok: true,
    result: {
      lines: computed,
      subtotal,
      discount,
      discount_pct: discountPct,
      total,
      production_days: maxProductionDays,
    },
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
