import type OpenAI from 'openai';
import type { ChatRole } from './ai-context';
import { getBusinessContext, searchKnowledgeBase } from './ai-context';
import { getToolsForRole, executeTool } from './ai-tools';
import { getLocalLLM, LLM_TIERS } from './local-llm';

export type { ChatRole };

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(params: {
  message: string;
  role: ChatRole;
  userId?: string;
  history: Message[];
}): Promise<{ reply: string; toolUsed?: string }> {
  const { message, role, userId, history } = params;

  const businessContext = getBusinessContext(role, userId);
  const kbContext = await searchKnowledgeBase(message);
  const systemContent = kbContext ? `${businessContext}\n\n${kbContext}` : businessContext;

  const tools = getToolsForRole(role);
  const client = getLocalLLM();
  // Public chat → small (cheap, fast). Authenticated cabinets → large (reasoning + tools).
  const tier: 'small' | 'large' = role === 'public' ? 'small' : 'large';
  const model = LLM_TIERS[tier];
  const capability = role === 'public' ? 'chat.public' : 'chat.authenticated';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    tools: tools.length > 0 ? tools : undefined,
    tool_choice: tools.length > 0 ? 'auto' : undefined,
  }, {
    headers: { 'X-Capability': capability, 'X-Tier': tier },
  });

  const choice = response.choices[0];

  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    return { reply: choice.message.content ?? '' };
  }

  const toolCall = choice.message.tool_calls[0];
  if (toolCall.type !== 'function') {
    return { reply: choice.message.content ?? '' };
  }

  let toolArgs: Record<string, unknown> = {};
  try {
    toolArgs = JSON.parse(toolCall.function.arguments ?? '{}') as Record<string, unknown>;
  } catch {
    // malformed args — proceed with empty object
  }

  const toolResult = await executeTool(toolCall.function.name, toolArgs, role, userId);

  const followUp = await client.chat.completions.create({
    model,
    messages: [
      ...messages,
      choice.message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      },
    ],
  }, {
    headers: { 'X-Capability': capability, 'X-Tier': tier },
  });

  return {
    reply: followUp.choices[0].message.content ?? '',
    toolUsed: toolCall.function.name,
  };
}
