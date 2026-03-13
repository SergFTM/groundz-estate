import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { ChatRole } from './ai-context';
import { getBusinessContext, searchKnowledgeBase } from './ai-context';
import { getToolsForRole, executeTool } from './ai-tools';
import { getSetting } from './settings';

export type { ChatRole };

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function getOpenAI(): Promise<OpenAI> {
  const dbKey = await getSetting('openai_api_key');
  const apiKey = dbKey || OPENAI_API_KEY;
  return new OpenAI({ apiKey });
}

export async function chat(params: {
  message: string;
  role: ChatRole;
  userId?: string;
  history: Message[];
}): Promise<{ reply: string; toolUsed?: string }> {
  const { message, role, userId, history } = params;

  // Layer 3: static business context (pass userId per spec signature — reserved for future personalisation)
  const businessContext = getBusinessContext(role, userId);

  // Layer 1: conditional knowledge base search
  const kbContext = await searchKnowledgeBase(message);

  const systemContent = kbContext ? `${businessContext}\n\n${kbContext}` : businessContext;

  // Layer 2: role-scoped tools (0 tokens upfront — only paid if AI calls a tool)
  const tools = getToolsForRole(role);
  const openai = await getOpenAI();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: tools.length > 0 ? tools : undefined,
    tool_choice: tools.length > 0 ? 'auto' : undefined,
  });

  const choice = response.choices[0];

  // No tool call — return directly
  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    return { reply: choice.message.content ?? '' };
  }

  // Execute first tool call only (max one per request)
  const toolCall = choice.message.tool_calls[0];

  // Narrow to function tool call (the only type we issue via getToolsForRole)
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

  // Second call with tool result
  const followUp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      ...messages,
      choice.message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      },
    ],
  });

  return {
    reply: followUp.choices[0].message.content ?? '',
    toolUsed: toolCall.function.name,
  };
}
