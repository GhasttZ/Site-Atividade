/**
 * Tipos internos do payload OpenRouter (formato OpenAI-compatible).
 *
 * Separados da impl pra manter cada arquivo <200 linhas.
 */

export interface OpenRouterChatRequest {
  model: string
  messages: OpenRouterMessage[]
  tools?: OpenRouterTool[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' }
}

export interface OpenRouterMessage {
  role: string
  content: string
  name?: string
  tool_call_id?: string
  tool_calls?: OpenRouterToolCall[]
}

export interface OpenRouterTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface OpenRouterToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface OpenRouterChatResponse {
  model: string
  choices: Array<{
    message: {
      role: string
      content: string | null
      tool_calls?: OpenRouterToolCall[]
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
