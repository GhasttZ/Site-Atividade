import { Package } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listProducts } from '@/lib/repositories/products'
import { formatBRL } from '@/lib/utils'
import type { Product, ProductCategory } from '@/lib/schemas'
import { toggleProductActiveAction } from './actions'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fardamento_escolar: 'Fardamento Escolar',
  fardamento_empresarial: 'Fardamento Empresarial',
  bolsas: 'Bolsas',
}

export default async function CatalogPage() {
  const products = await listProducts({ activeOnly: false })

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Catálogo"
        subtitle={`${products.length} produto(s) cadastrado(s)`}
      />

      <div className="px-4 md:px-8 py-6 space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {CATEGORY_LABELS[category as ProductCategory] ?? category}{' '}
              <span className="text-sm text-muted-foreground font-normal">
                ({items.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((product) => (
                <Card key={product.id} className={product.active ? '' : 'opacity-60'}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </div>
                        <div className="font-semibold mt-0.5">{product.name}</div>
                      </div>
                      <Badge variant={product.active ? 'success' : 'secondary'}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-baseline justify-between text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Preço</div>
                        <div className="font-bold text-base">
                          {formatBRL(product.base_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Mín. pedido</div>
                        <div className="font-semibold">{product.minimum_order_qty} un.</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Produção: {product.production_days_min}-
                      {product.production_days_max} dias úteis
                    </div>

                    {product.customization_options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.customization_options.slice(0, 3).map((opt, i) => (
                          <Badge key={i} variant="outline" className="font-normal">
                            {opt.label}: {formatBRL(opt.price_per_piece)}
                          </Badge>
                        ))}
                        {product.customization_options.length > 3 && (
                          <Badge variant="outline" className="font-normal">
                            +{product.customization_options.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <form action={toggleProductActiveAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button
                        type="submit"
                        variant={product.active ? 'outline' : 'default'}
                        size="sm"
                        className="w-full"
                      >
                        {product.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
