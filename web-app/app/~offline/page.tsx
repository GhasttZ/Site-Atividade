import { WifiOff } from 'lucide-react'

export const metadata = { title: 'Você está offline' }

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto w-16 h-16 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Sem conexão</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar essa página agora. Verifique sua conexão e
          tente novamente — algumas áreas já visitadas continuam disponíveis em
          modo offline.
        </p>
      </div>
    </div>
  )
}
