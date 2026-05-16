/**
 * Schemas de Produto e Variante.
 *
 * Refletem o schema SQL. Tipo TS derivado via z.infer.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------
// PRODUCT CATEGORY
// ---------------------------------------------------------------------

export const ProductCategorySchema = z.enum([
  'fardamento_escolar',
  'fardamento_empresarial',
  'bolsas',
])
export type ProductCategory = z.infer<typeof ProductCategorySchema>

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  fardamento_escolar: 'Fardamento Escolar',
  fardamento_empresarial: 'Fardamento Empresarial',
  bolsas: 'Bolsas',
}

// ---------------------------------------------------------------------
// CUSTOMIZATION OPTION
// ---------------------------------------------------------------------

export const CustomizationTypeSchema = z.enum([
  'bordado',
  'bordado_dupla',
  'silk',
  'silk_dupla',
  'silk_color',
  'sublimacao',
])
export type CustomizationType = z.infer<typeof CustomizationTypeSchema>

export const CustomizationOptionSchema = z.object({
  type: CustomizationTypeSchema,
  label: z.string().min(1),
  price_per_piece: z.number().nonnegative(),
})
export type CustomizationOption = z.infer<typeof CustomizationOptionSchema>

// ---------------------------------------------------------------------
// PRODUCT
// ---------------------------------------------------------------------

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  category: ProductCategorySchema,
  description: z.string().nullable(),
  base_price: z.number().positive(),
  production_days_min: z.number().int().positive(),
  production_days_max: z.number().int().positive(),
  minimum_order_qty: z.number().int().positive(),
  customization_options: z.array(CustomizationOptionSchema),
  image_url: z.string().url().nullable(),
  active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type Product = z.infer<typeof ProductSchema>

export const CreateProductInputSchema = ProductSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})
  .partial({ description: true, image_url: true, active: true })
  .refine((d) => d.production_days_max >= d.production_days_min, {
    message: 'production_days_max deve ser >= production_days_min',
    path: ['production_days_max'],
  })
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>

// ---------------------------------------------------------------------
// PRODUCT VARIANT
// ---------------------------------------------------------------------

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  price_adjustment: z.number(),
  sku_suffix: z.string().nullable(),
  created_at: z.coerce.date(),
})
export type ProductVariant = z.infer<typeof ProductVariantSchema>
