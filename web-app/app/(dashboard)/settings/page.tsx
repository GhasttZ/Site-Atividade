import { Settings as SettingsIcon, Sparkles, ShieldCheck, Bot } from 'lucide-react'
import { Header } from '@/components/header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { getAppSettings } from '@/lib/repositories/knowledge-settings'
import { updateSettingsAction, togglePresentationModeAction } from './actions'

export default async function SettingsPage() {
  const settings = await getAppSettings()

  return (
    <>
      <Header title="Configurações" subtitle="Comportamento da IA e da demo" />

      <div className="px-4 md:px-8 py-6 space-y-6 max-w-3xl">
        <Card className={settings.presentation_mode ? 'border-primary bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Modo apresentação
            </CardTitle>
            <CardDescription>
              Quando ativo, o painel exibe um banner discreto e algumas timestamps são
              normalizadas pra a demo ficar consistente. Útil pra apresentações ao vivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={togglePresentationModeAction}>
              <Button type="submit" variant={settings.presentation_mode ? 'default' : 'outline'}>
                {settings.presentation_mode ? '✓ Ativado' : 'Ativar modo apresentação'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Limites de venda autônoma
            </CardTitle>
            <CardDescription>
              Acima destes valores, a IA escala automaticamente pra um humano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_pieces">Máx. peças por pedido autônomo</Label>
                  <Input
                    id="max_pieces"
                    name="autonomous_sale_max_pieces"
                    type="number"
                    min={1}
                    max={500}
                    defaultValue={settings.autonomous_sale_max_pieces}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Máx. desconto autônomo (%)</Label>
                  <Input
                    id="max_discount"
                    name="autonomous_discount_max_pct"
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    defaultValue={settings.autonomous_discount_max_pct}
                  />
                </div>
              </div>
              <Button type="submit">Salvar limites</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Tom de voz da Maria Helena
            </CardTitle>
            <CardDescription>
              Descrição livre que vai como complemento ao prompt principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent_tone">Tom desejado</Label>
                <Textarea
                  id="agent_tone"
                  name="agent_tone"
                  rows={4}
                  defaultValue={settings.agent_tone ?? ''}
                  placeholder="Ex: acolhedora, direta, nordestina, sem fórmulas batidas..."
                />
              </div>
              <Button type="submit">Salvar tom</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Conformidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dpo_email">E-mail do DPO (LGPD)</Label>
                <Input
                  id="dpo_email"
                  name="dpo_email"
                  type="email"
                  defaultValue={settings.dpo_email ?? ''}
                  placeholder="dpo@malhariabonfim.com.br"
                />
              </div>
              <Button type="submit">Salvar conformidade</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
