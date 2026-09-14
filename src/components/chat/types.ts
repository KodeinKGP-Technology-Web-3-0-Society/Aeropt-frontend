import { AgentChatResponse } from "@/lib/agent";

export type PrerequisiteNode = {
  concept: string;
  score: number;
  color: string;
};

export type StructuredResponse = {
  filling_gap: string;
  solution_steps: string[];
  insight: string;
  try_next: string[];
  concepts_mentioned: string[];
  prerequisite_chain: PrerequisiteNode[];
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured_response?: StructuredResponse | null;
  agent?: AgentChatResponse | null;
};

export type Session = {
  id: string;
  title: string;
  updatedAt?: string | null;
  preview?: string | null;
};
