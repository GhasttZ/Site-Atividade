/**
 * Implementação OpenRouter do AIProvider.
 *
 * Responsabilidade única: orquestrar a chain de fallback de modelos
 * e a chamada HTTP. Tradução de payload e parsing vivem no mapper.
 *
 * Estratégia de fallback:
 *  1. Tenta primaryModel (default: meta-llama/llama-3.3-70b-instruct:free)
 *  2. Em 429/503/timeout: tenta reasoningModel (deepseek/deepseek-r1:free)
 *  3. Em nova falha: tenta fallbackModel (openrouter/free auto-router)
 *  4. Se tudo falhar: lança AIError
 */

import { AIError } from './types'
import type { AIProvider } from './provider'
import type { ChatRequest, ChatResponse } from './types'
import type { OpenRouterChatResponse } from './openrouter-types'
import {
  buildPayload,
  parseResponse,
  mapStatusToCode,
  wrapError,
  isRecoverableError,
} from './openrouter-mapper'

interface OpenRouterConfig {
  apiKey: string
  primaryModel: string
  reasoningModel?: string
  fallbackModel?: string
  baseUrl: string
  appName: string
  appUrl?: string
}

const DEFAULT_TIMEOUT_MS = 30_000

export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter'

  constructor(private readonly config: OpenRouterConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const models = this.modelChain(request.model)
    let lastError: AIError | null = null

    for (const model of models) {
      try {
        return await this.attempt(request, model)
      } catch (err) {
        const aiErr = err instanceof AIError ? err : wrapError(err)
        lastError = aiErr
        if (!isRecoverableError(aiErr)) throw aiErr
        // segue para próximo modelo da chain
      }
    }
    throw lastError ?? new AIError('unknown', 'Falha em toda a chain de modelos')
  }

  private modelChain(override?: string): string[] {
    if (override) return [override]
    const chain: string[] = [this.config.primaryModel]
    if (this.config.reasoningModel) chain.push(this.config.reasoningModel)
    if (this.config.fallbackModel) chain.push(this.config.fallbackModel)
    return chain
  }

  private async attempt(request: ChatRequest, model: string): Promise<ChatResponse> {
    const t0 = Date.now()
    const body = buildPayload(request, model)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      throw wrapError(err)
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new AIError(
        mapStatusToCode(res.status),
        `OpenRouter ${res.status}: ${text.slice(0, 500)}`,
        { status: res.status }
      )
    }

    const json = (await res.json()) as OpenRouterChatResponse
    return parseResponse(json, model, Date.now() - t0)
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': this.config.appName,
    }
    if (this.config.appUrl) headers['HTTP-Referer'] = this.config.appUrl
    return headers
  }
}
