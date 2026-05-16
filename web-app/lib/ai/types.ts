/**
 * Tipos comuns da camada de IA.
 *
 * Modelados para refletir o subconjunto necessário do contrato
 * OpenAI-compatible (que OpenRouter, Anthropic, OpenAI e a maioria
 * dos providers seguem). Estendidos quando provider-específicos
 * via campo `metadata`.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------
// MENSAGENS
// ---------------------------------------------------------------------

export const ChatRoleSchema = z.enum(['system', 'user', 'assistant', 'tool'])
export type ChatRole = z.infer<typeof ChatRoleSchema>

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string(),
  /** Para mensagens de role 'tool': o id da tool call sendo respondida */
  toolCallId: z.string().optional(),
  /** Para mensagens de role 'assistant' que invocam tools */
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        arguments: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
  /** Nome do remetente quando role='tool' (nome da tool) */
  name: z.string().optional(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

// ---------------------------------------------------------------------
// TOOL DEFINITIONS
// ---------------------------------------------------------------------

export const ToolDefinitionSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1),
  /** JSON Schema do input da tool */
  parameters: z.record(z.string(), z.unknown()),
})
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>

// ---------------------------------------------------------------------
// REQUEST / RESPONSE
// ---------------------------------------------------------------------

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  tools: z.array(ToolDefinitionSchema).optional(),
  /** Override de modelo. Quando omitido, usa o default do provider. */
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  /** Force JSON output (quando o modelo suporta) */
  jsonMode: z.boolean().optional(),
})
export type ChatRequest = z.infer<typeof ChatRequestSchema>

export interface ChatResponse {
  /** Texto da resposta. Vazio se a IA optou por tool calls. */
  content: string
  /** Tool calls solicitadas pela IA (se houver) */
  toolCalls: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
  /** Razão de término: 'stop' | 'tool_calls' | 'length' | 'error' */
  finishReason: FinishReason
  usage: TokenUsage
  /** Provider + modelo efetivamente usados (após fallback) */
  modelUsed: string
  providerUsed: string
  /** Latência total da chamada em ms */
  latencyMs: number
}

export type FinishReason = 'stop' | 'tool_calls' | 'length' | 'error'

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

// ---------------------------------------------------------------------
// ERROS
// ---------------------------------------------------------------------

export type AIErrorCode =
  | 'rate_limit'
  | 'auth'
  | 'invalid_request'
  | 'model_unavailable'
  | 'timeout'
  | 'network'
  | 'unknown'

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly providerError?: unknown
  ) {
    super(message)
    this.name = 'AIError'
  }
}
