import { ThinkingMode } from "./types";

export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface ApiMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

export const api = {
  async createConversation(title: string = "New Chat"): Promise<Conversation> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to create conversation");
    return response.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await fetch("/api/conversations");
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return response.json();
  },

  async getConversation(id: number): Promise<Conversation & { messages: ApiMessage[] }> {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) throw new Error("Failed to fetch conversation");
    return response.json();
  },

  async deleteConversation(id: number): Promise<void> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete conversation");
  },

  async updateConversationTitle(id: number, title: string): Promise<void> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to update conversation title");
  },

  async generateSmartTitle(id: number, userMessage: string): Promise<{ title: string }> {
    const response = await fetch(`/api/conversations/${id}/generate-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage }),
    });
    if (!response.ok) throw new Error("Failed to generate title");
    return response.json();
  },

  async sendMessage(
    conversationId: number,
    content: string,
    mode: string | null,
    onChunk: (content: string) => void,
    onDone: () => void,
    attachments?: { name: string; type: string; url: string }[],
    webSearchEnabled?: boolean,
    onSearchStatus?: (status: string) => void
  ): Promise<void> {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mode, attachments, webSearchEnabled }),
    });

    if (!response.ok) throw new Error("Failed to send message");
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              if (data.suggestions) {
                onChunk({ suggestions: data.suggestions } as any);
              }
              onDone();
            } else if (data.searchStatus && onSearchStatus) {
              onSearchStatus(data.searchStatus);
            } else if (data.content) {
              onChunk(data.content);
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error("Error parsing SSE chunk:", e);
          }
        }
      }
    }
  },
};
