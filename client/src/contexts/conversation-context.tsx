import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { api, Conversation, ApiMessage } from "@/lib/api";
import { Message } from "@/lib/types";

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: number | null;
  messages: Message[];
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  startNewConversation: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  updateConversationTitle: (id: number, title: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const selectConversation = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const data = await api.getConversation(id);
      setCurrentConversationId(id);
      const loadedMessages: Message[] = data.messages.map((msg: ApiMessage) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const conversation = await api.createConversation("New Chat");
      setCurrentConversationId(conversation.id);
      setMessages([]);
      await loadConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadConversations]);

  const deleteConversation = useCallback(async (id: number) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }, [currentConversationId]);

  const updateConversationTitle = useCallback(async (id: number, title: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, title } : c
    ));
    try {
      await api.updateConversationTitle(id, title);
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!isLoading && currentConversationId === null && conversations.length > 0) {
      selectConversation(conversations[0].id);
    } else if (!isLoading && currentConversationId === null && conversations.length === 0) {
      // Ensure we have a conversation to send messages to
      startNewConversation();
    }
  }, [conversations, isLoading, currentConversationId, selectConversation, startNewConversation]);

  return (
    <ConversationContext.Provider value={{
      conversations,
      currentConversationId,
      messages,
      isLoading,
      loadConversations,
      selectConversation,
      startNewConversation,
      deleteConversation,
      setMessages,
      updateConversationTitle,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}
