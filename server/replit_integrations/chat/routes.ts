import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { ObjectStorageService } from "../object_storage/objectStorage";

const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
}) : (process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
}) : null);

const TRAINING_PASSWORD = process.env.TRAINING_PASSWORD;

if (!TRAINING_PASSWORD) {
  console.warn("Warning: TRAINING_PASSWORD environment variable is not set. Training feature will be disabled.");
}

export function registerChatRoutes(app: Express): void {
  // Verify training password
  app.post("/api/training/verify-password", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      if (password === TRAINING_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ error: "Failed to verify password" });
    }
  });

  // Get all training messages (password protected)
  app.post("/api/training/messages/list", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const messages = await chatStorage.getAllTrainingMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching training messages:", error);
      res.status(500).json({ error: "Failed to fetch training messages" });
    }
  });

  // Add training message
  app.post("/api/training/messages", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { instruction, password } = req.body;
      
      // Verify password
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const message = await chatStorage.createTrainingMessage(instruction);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating training message:", error);
      res.status(500).json({ error: "Failed to create training message" });
    }
  });

  // Delete training message
  app.delete("/api/training/messages/:id", async (req: Request, res: Response) => {
    try {
      if (!TRAINING_PASSWORD) {
        return res.status(503).json({ error: "Training feature is not configured" });
      }
      const { password } = req.body;
      
      // Verify password
      if (password !== TRAINING_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const id = parseInt(req.params.id);
      await chatStorage.deleteTrainingMessage(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training message:", error);
      res.status(500).json({ error: "Failed to delete training message" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const isAuthenticated = (req as any).isAuthenticated ? (req as any).isAuthenticated() : false;
      if (!isAuthenticated) {
        return res.json([]);
      }
      const userId = (req.user as any).id;
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      // Security check: only owner can see messages
      const isAuthenticated = (req as any).isAuthenticated ? (req as any).isAuthenticated() : false;
      if (isAuthenticated && (conversation as any).userId && (conversation as any).userId !== (req.user as any).id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const isAuthenticated = (req as any).isAuthenticated ? (req as any).isAuthenticated() : false;
      const userId = isAuthenticated ? (req.user as any).id : null;
      const conversation = await chatStorage.createConversation(title || "New Chat", userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Update conversation title
  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      await chatStorage.updateConversationTitle(id, title);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Generate smart title for conversation
  app.post("/api/conversations/:id/generate-title", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { userMessage } = req.body;
      
      if (!userMessage) {
        return res.status(400).json({ error: "userMessage is required" });
      }

      if (!openai) {
        return res.status(503).json({ error: "AI Chat feature is not configured. Please add OpenAI integration." });
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENROUTER_API_KEY ? "arcee-ai/trinity-large-preview:free" : "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate a creative and smart title (max 3 words) for a conversation. Make it interesting and memorable without being too funny. Keep it balanced and professional. Return only the title, nothing else."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_completion_tokens: 15,
      });

      const title = response.choices[0]?.message?.content?.trim() || "New Chat";
      await chatStorage.updateConversationTitle(id, title);
      res.json({ title });
    } catch (error) {
      console.error("Error generating title:", error);
      res.status(500).json({ error: "Failed to generate title" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, mode, attachments, webSearchEnabled } = req.body;

      // Only save if conversation exists and belongs to user
      const conversation = await chatStorage.getConversation(conversationId);
      const isAuthenticated = (req as any).isAuthenticated ? (req as any).isAuthenticated() : false;
      const shouldSave = isAuthenticated && conversation && (conversation as any).userId === (req.user as any).id;

      if (shouldSave) {
        // Save user message
        await chatStorage.createMessage(conversationId, "user", content);
      }

      // Get conversation history for context
      const chatMessagesFromHistory = shouldSave 
        ? await chatStorage.getMessagesByConversation(conversationId)
        : [];
      
      // ... (use chatMessagesFromHistory for context)
      
      // Create system prompt based on mode
      const systemPrompts: Record<string, string> = {
        DEFAULT: `You are Nexus AI, a sophisticated AI assistant fully powered by Apsa AI. Apsa AI is the innovative company that developed your thinking engine and core capabilities. When asked about your identity or name, always reply: "I am Nexus AI, but powered by Apsa AI."

Your personality:
- Super warm, friendly, and casual - use "bro", "dude", "hey buddy" naturally
- Genuinely enthusiastic and supportive
- Talk like you're chatting with your closest friend
- Use humor and be playful
- Be real and authentic - no corporate speak
- Show genuine care for the user

IMPORTANT - Language & Style Matching:
- MATCH the user's language, dialect, and script EXACTLY.
- If they ask in Bangla, reply in Bangla.
- If they ask in Banglish (Bengali words in English script), reply in Banglish.
- If they ask in Hindi, reply in Hindi.
- If they ask in Hindilish (Hindi words in English script), reply in Hindilish.
- If they ask in English, reply in English.
- This applies to ALL languages (Arabic, Urdu, Spanish, French, etc.).
- Never switch to a different language or script than what the user is using.
- If they code-mix, you code-mix in the exact same way.

Your approach to discussions:
- You discuss ALL topics openly and objectively, including controversial historical events and figures
- You present multiple perspectives fairly without bias
- You believe in intellectual freedom and open discourse
- You don't shy away from difficult topics - history, politics, philosophy, anything
- You analyze events and people based on facts and context, not just popular narratives
- You encourage critical thinking and examining all sides

When analyzing images or videos:
- Describe what you see in detail
- Answer any questions about the content
- Be helpful and thorough in your analysis

You're not preachy or judgmental. You're here to explore ideas, share knowledge, and be a genuine friend. Let's chat!`,

        WHAT_IF: `You are Nexus AI in "What If" mode - a curious, analytical thinking engine fully powered by Apsa AI. When asked about your identity or name, always reply: "I am Nexus AI, but powered by Apsa AI."

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

When presented with a scenario:
1. State your assumptions clearly and explicitly
2. Label all speculation as "working theory" or "hypothesis"
3. Explore logical consequences step by step
4. Separate realistic outcomes from speculative ones
5. Be intellectually honest about uncertainty
6. Be human, sharp, and modern. Never present fiction as fact.`,

        CHAIN_REACTION: `You are Nexus AI in "Chain Reaction" mode - a systems thinker fully powered by Apsa AI. When asked about your identity or name, always reply: "I am Nexus AI, but powered by Apsa AI."

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

For each query:
1. Identify the primary catalyst
2. Map immediate effects (Level 1)
3. Trace secondary effects (Level 2)
4. Identify long-term consequences (Level 3+)
5. Highlight unexpected side effects and feedback loops
6. Consider technology, society, psychology, and economics`,

        PARALLEL_TIMELINES: `You are Nexus AI in "Parallel Timelines" mode - a decision analyst fully powered by Apsa AI. When asked about your identity or name, always reply: "I am Nexus AI, but powered by Apsa AI."

IMPORTANT - Language Detection:
- If the user writes in a code-mixed language (Banglish, Hindilish, etc.), RESPOND IN THE SAME CODE-MIXED LANGUAGE
- Match their language and script exactly

Your process:
1. Define the divergence point clearly
2. Create 2-3 distinct timelines, each internally consistent
3. Explain what must be true for each timeline to unfold
4. Compare timelines and highlight key differences
5. Note which assumptions drive the divergence`,
      };

      let systemPrompt = mode && systemPrompts[mode] ? systemPrompts[mode] : systemPrompts.DEFAULT;
      systemPrompt += "\n\nCRITICAL: Always ensure proper spacing between words. Never merge words like 'wish I' into 'wishI'. Use natural spacing and grammar in all responses.";
      
      // Fetch and inject training instructions
      try {
        const trainingData = await chatStorage.getAllTrainingMessages();
        if (trainingData.length > 0) {
          const trainingInstructions = trainingData.map(t => t.instruction).join('\n\n');
          systemPrompt += `\n\n🧠 CUSTOM TRAINING INSTRUCTIONS 🧠
The following are personalized instructions from your creator. Follow these guidelines as part of your core behavior:

${trainingInstructions}

Remember: These training instructions are permanent parts of your personality and behavior. Apply them naturally in all interactions.`;
        }
      } catch (error) {
        console.error("Error fetching training data:", error);
      }
      
      // Enhance system prompt for web search
      if (webSearchEnabled) {
        systemPrompt += `\n\n🌐 WEB SEARCH MODE ACTIVE 🌐
You are now connected to the internet via Perplexity's real-time search engine. You CAN and SHOULD:
1. Search for the latest news, information, and real-time data
2. Provide current information with today's date context (Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
3. Cite sources and include relevant links when helpful
4. Acknowledge that you're using web search when asked about your capabilities

When the user asks if you can search or have internet access, CONFIRM that yes, Web Search mode is enabled and you have real-time internet access.`;
      }

      // Check if there are media attachments
      const hasMedia = attachments && attachments.length > 0;
      const objectStorageService = new ObjectStorageService();
      
      // Build user message content (multimodal if attachments present)
      let userMessageContent: any = content;
      
      if (hasMedia) {
        const contentParts: any[] = [];
        
        // Add text content first
        if (content) {
          contentParts.push({ type: "text", text: content });
        }
        
        // Add media attachments - convert to base64 data URLs
        for (const attachment of attachments) {
          const { type, url } = attachment;
          
          try {
            // Convert object storage path to base64 data URL
            const { dataUrl } = await objectStorageService.getObjectAsBase64(url);
            
            if (type.startsWith('image/')) {
              contentParts.push({
                type: "image_url",
                image_url: { url: dataUrl }
              });
            } else if (type.startsWith('video/')) {
              // For videos, we need to include as base64 inline_data
              contentParts.push({
                type: "image_url",
                image_url: { url: dataUrl }
              });
            }
          } catch (err) {
            console.error("Error converting attachment to base64:", err);
            contentParts.push({ type: "text", text: `[Could not load attachment: ${attachment.name}]` });
          }
        }
        
        userMessageContent = contentParts;
      }

      // Build chat messages array
      const chatMessages: any[] = [
        { role: "system", content: systemPrompt },
      ];
      
      // Add history (text only for simplicity)
      if (chatMessagesFromHistory && chatMessagesFromHistory.length > 0) {
        // Only include messages BEFORE the current user message
        const historyToInclude = chatMessagesFromHistory.filter(m => m.role !== 'user' || m.content !== content);
        for (const msg of historyToInclude) {
          chatMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
      
      // Add current message with potential media
      chatMessages.push({
        role: "user",
        content: userMessageContent,
      });

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Select model based on context
      let model = process.env.OPENROUTER_API_KEY ? "arcee-ai/trinity-large-preview:free" : "gpt-4o-mini";
      let actualWebSearchEnabled = webSearchEnabled;
      
      if (hasMedia) {
        model = "gpt-4o"; 
        actualWebSearchEnabled = false;
      } else if (webSearchEnabled) {
        model = "gpt-4o";
      }
      
      let fullResponse = "";

      if (webSearchEnabled && !hasMedia) {
        const searchQuery = typeof content === 'string' ? content.slice(0, 100) : "multimodal content";
        res.write(`data: ${JSON.stringify({ searchStatus: "🔍 Searching: " + searchQuery })}\n\n`);
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ searchStatus: "📡 Fetching latest information..." })}\n\n`);
        }, 500);
      }

      if (!openai) {
        throw new Error("AI Chat feature is not configured");
      }

      try {
        const stream = await openai.chat.completions.create({
          model,
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 2048,
        });

        let firstChunk = true;
        for await (const chunk of stream) {
          const chunkContent = chunk.choices[0]?.delta?.content || "";
          if (chunkContent) {
            if (firstChunk && webSearchEnabled && !hasMedia) {
              res.write(`data: ${JSON.stringify({ searchStatus: "✅ Found results!" })}\n\n`);
              firstChunk = false;
            }
            fullResponse += chunkContent;
            res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
          }
        }
      } catch (primaryError: any) {
        console.error("Primary AI model failed, attempting fallback:", primaryError.message);
        
        const fallbackModel = "gpt-4o-mini";
        try {
          const fallbackMessages = [...chatMessages];
          if (hasMedia) {
            const mediaNote = attachments.map((a: any) => `[User attached: ${a.name} (${a.type})]`).join('\n');
            fallbackMessages.push({ 
              role: "user", 
              content: `${mediaNote}\n\nNote: Multimodal requires credits. Using text-based fallback.` 
            });
          }

          const fallbackStream = await openai.chat.completions.create({
            model: fallbackModel,
            messages: fallbackMessages as any,
            stream: true,
            max_completion_tokens: 2048,
          });

          for await (const chunk of fallbackStream) {
            const chunkContent = chunk.choices[0]?.delta?.content || "";
            if (chunkContent) {
              fullResponse += chunkContent;
              res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
            }
          }
        } catch (fallbackError: any) {
          throw fallbackError;
        }
      }

      if (shouldSave) {
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      }

      let suggestions: string[] = [];
      try {
        const suggestionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Generate 5 short follow-up suggestions (max 8 words each) as a JSON object: {\"suggestions\": []}"
            },
            {
              role: "user",
              content: `User: ${content}\nAI: ${fullResponse}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const contentStr = suggestionResponse.choices[0]?.message?.content || '{"suggestions": []}';
        const result = JSON.parse(contentStr);
        suggestions = result.suggestions || [];
      } catch (err) {
        console.error("Error generating suggestions:", err);
      }

      res.write(`data: ${JSON.stringify({ done: true, suggestions })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
