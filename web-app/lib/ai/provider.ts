/**
 * AIProvider — abstração do provider de IA.
 *
 * Implementações vivem em arquivos próprios (./openrouter.ts, futuros
 * ./anthropic.ts, ./openai.ts). A escolha em runtime é controlada pela
 * env var AI_PROVIDER.
 *
 * Princípio (DIP): código de domínio depende dessa interface, nunca
 * de uma impl concreta.
 */

import type { ChatRequest, ChatResponse } from './types'

/**
 * Contrato que todo provider de IA deve cumprir.
 *
 * Implementações são responsáveis por:
 * - Traduzir ChatRequest pro formato do vendor
 * - Lidar com rate limits e fallbacks de modelo
 * - Mapear erros pro AIError
 * - Medir latência e contabilizar tokens
 */
export interface AIProvider {
  /** Identificador estável do provider, usado em logs */
  readonly name: string

  /**
   * Envia um chat request e retorna a resposta.
   *
   * @throws {AIError} em qualquer falha não-recuperável
   */
  chat(request: ChatRequest): Promise<ChatResponse>
}

// ---------------------------------------------------------------------
// FACTORY
// ---------------------------------------------------------------------

type ProviderName = 'openrouter' | 'anthropic' | 'openai'

function resolveProviderName(): ProviderName {
  const raw = process.env.AI_PROVIDER?.toLowerCase()
  if (raw === 'openrouter' || raw === 'anthropic' || raw === 'openai') {
    return raw
  }
  // Default seguro
  return 'openrouter'
}

let cachedProvider: AIProvider | null = null

/**
 * Retorna o provider configurado.
 *
 * Memoizado por module instance — uma única instância por processo
 * Node (suficiente; recriar a cada chamada seria desperdício).
 *
 * Trocar de provider em produção: mudar env var AI_PROVIDER e
 * redeploy. Não há trocar runtime intencional.
 */
export async function getAIProvider(): Promise<AIProvider> {
  if (cachedProvider !== null) return cachedProvider

  const name = resolveProviderName()
  switch (name) {
    case 'openrouter': {
      const { OpenRouterProvider } = await import('./openrouter')
      cachedProvider = new OpenRouterProvider({
        apiKey: requireEnv('OPENROUTER_API_KEY'),
        primaryModel: requireEnv('OPENROUTER_PRIMARY_MODEL'),
        reasoningModel: process.env.OPENROUTER_REASONING_MODEL,
        fallbackModel: process.env.OPENROUTER_FALLBACK,
        baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
        appName: process.env.OPENROUTER_APP_NAME ?? 'malharia-bonfim-demo',
        appUrl: process.env.OPENROUTER_APP_URL,
      })
      return cachedProvider
    }
    case 'anthropic':
    case 'openai':
      throw new Error(
        `Provider '${name}' ainda não implementado. ` +
          `Veja docs/como-virar-producao.md para o guia de implementação.`
      )
  }
}

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`)
  }
  return value
}
