/**
 * Builder / parser de payloads OpenRouter.
 *
 * Separado da classe Provider (SRP): Provider orquestra fallback;
 * estas funções traduzem entre tipos do domínio e do vendor.
 */

import { AIError } from './types'
import type {
  AIErrorCode,
  ChatRequest,
  ChatResponse,
  FinishReason,
  TokenUsage,
} from './types'
import type {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
} from './openrouter-types'

export function buildPayload(request: ChatRequest, model: string): OpenRouterChatRequest {
  const payload: OpenRouterChatRequest = {
    model,
    messages: request.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      ...(m.name ? { name: m.name } : {}),
      ...(m.toolCalls && m.toolCalls.length > 0
        ? {
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          }
        : {}),
    })),
  }

  if (request.tools && request.tools.length > 0) {
    payload.tools = request.tools.map((t) => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }))
  }
  if (request.temperature !== undefined) payload.temperature = request.temperature
  if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens
  if (request.jsonMode) payload.response_format = { type: 'json_object' }

  return payload
}

export function parseResponse(
  json: OpenRouterChatResponse,
  requestedModel: string,
  latencyMs: number
): ChatResponse {
  const choice = json.choices?.[0]
  if (!choice) throw new AIError('invalid_request', 'Resposta sem choices')

  const usage: TokenUsage = {
    promptTokens: json.usage?.prompt_tokens ?? 0,
    completionTokens: json.usage?.completion_tokens ?? 0,
    totalTokens: json.usage?.total_tokens ?? 0,
  }

  const toolCalls = (choice.message.tool_calls ?? []).map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: parseToolArgs(tc.function.arguments),
  }))

  return {
    content: choice.message.content ?? '',
    toolCalls,
    finishReason: mapFinishReason(choice.finish_reason),
    usage,
    modelUsed: json.model ?? requestedModel,
    providerUsed: 'openrouter',
    latencyMs,
  }
}

function parseToolArgs(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

function mapFinishReason(raw: string | undefined): FinishReason {
  switch (raw) {
    case 'stop':
      return 'stop'
    case 'tool_calls':
    case 'function_call':
      return 'tool_calls'
    case 'length':
      return 'length'
    default:
      return 'stop'
  }
}

export function mapStatusToCode(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate_limit'
  if (status === 408 || status === 504) return 'timeout'
  if (status >= 500) return 'model_unavailable'
  if (status >= 400) return 'invalid_request'
  return 'unknown'
}

export function wrapError(err: unknown): AIError {
  if (err instanceof AIError) return err
  if (err instanceof Error) {
    if (err.name === 'AbortError') return new AIError('timeout', 'Timeout', err)
    return new AIError('network', err.message, err)
  }
  return new AIError('unknown', String(err))
}

export function isRecoverableError(err: AIError): boolean {
  return (
    err.code === 'rate_limit' ||
    err.code === 'model_unavailable' ||
    err.code === 'timeout' ||
    err.code === 'network'
  )
}
