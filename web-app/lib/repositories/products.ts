import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ProductSchema, type Product, type CreateProductInput } from '@/lib/schemas'
import { RepositoryError, requireUserContext } from './_context'

export async function listProducts(filters?: {
  category?: Product['category']
  activeOnly?: boolean
}): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.activeOnly ?? true) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return (data ?? []).map((row) => ProductSchema.parse(row))
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('sku', sku)
    .maybeSingle()
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return data ? ProductSchema.parse(data) : null
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return data ? ProductSchema.parse(data) : null
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const ctx = await requireUserContext()
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      tenant_id: ctx.tenantId,
      sku: input.sku,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      base_price: input.base_price,
      production_days_min: input.production_days_min,
      production_days_max: input.production_days_max,
      minimum_order_qty: input.minimum_order_qty,
      customization_options: input.customization_options,
      image_url: input.image_url ?? null,
      active: input.active ?? true,
    })
    .select('*')
    .single()
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
  return ProductSchema.parse(data)
}

export async function updateProduct(
  id: string,
  patch: Partial<CreateProductInput>
): Promise<Product> {
  const ctx = await requireUserContext()
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select('*')
    .single()
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
  return ProductSchema.parse(data)
}

export async function toggleProductActive(id: string): Promise<Product> {
  const current = await getProductById(id)
  if (!current) throw new RepositoryError('NOT_FOUND', 'Produto não encontrado')
  return updateProduct(id, { active: !current.active })
}
