import { BookOpen } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listKnowledgeChunks } from '@/lib/repositories/knowledge-settings'
import type { KnowledgeBaseChunk, KnowledgeCategory } from '@/lib/schemas'
import { toggleChunkAction } from './actions'

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  catalog: 'Catálogo',
  policies: 'Políticas',
  identity: 'Identidade',
  scripts: 'Roteiros',
}

const CATEGORY_DESCRIPTIONS: Record<KnowledgeCategory, string> = {
  catalog: 'Informações de produtos e customizações',
  policies: 'Pagamento, prazo, entrega, troca',
  identity: 'Quem é a empresa, valores, história',
  scripts: 'Modelos de resposta para situações específicas',
}

export default async function KnowledgeBasePage() {
  const chunks = await listKnowledgeChunks()

  const grouped = chunks.reduce<Record<string, KnowledgeBaseChunk[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Base de Conhecimento"
        subtitle={`${chunks.length} chunk(s) — fonte da verdade da IA`}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-sm">
            <p className="text-foreground">
              <strong>Como funciona:</strong> a Maria Helena (IA) consulta esses chunks
              durante o atendimento. Cada um tem uma <em>prioridade</em> (1-10) que pesa
              na ordem de relevância. Desativar um chunk faz a IA ignorá-lo.
            </p>
          </CardContent>
        </Card>

        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {CATEGORY_LABELS[category as KnowledgeCategory] ?? category}{' '}
                <span className="text-sm text-muted-foreground font-normal">
                  ({items.length})
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[category as KnowledgeCategory]}
              </p>
            </div>

            <div className="space-y-3">
              {items.map((chunk) => (
                <Card
                  key={chunk.id}
                  className={chunk.active ? '' : 'opacity-60'}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{chunk.title}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            P{chunk.priority}
                          </Badge>
                          {!chunk.active && (
                            <Badge variant="secondary">Desativado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 line-clamp-4">
                          {chunk.content}
                        </p>
                      </div>
                      <form action={toggleChunkAction} className="shrink-0">
                        <input type="hidden" name="id" value={chunk.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={chunk.active ? 'false' : 'true'}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {chunk.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {chunks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum chunk de conhecimento ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
