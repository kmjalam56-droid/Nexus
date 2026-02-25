export type ThinkingMode = 'WHAT_IF' | 'CHAIN_REACTION' | 'PARALLEL_TIMELINES' | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: ThinkingMode;
  thinkingProcess?: string[]; // The "steps" the AI took
  isThinking?: boolean;
}
