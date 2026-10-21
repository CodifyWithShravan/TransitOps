package com.example.transitops_backend.service;

import com.example.transitops_backend.entity.Conversation;
import com.example.transitops_backend.entity.Message;
import com.example.transitops_backend.entity.MessageRole;
import com.example.transitops_backend.repository.ConversationRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final ConversationRepository conversationRepository;

    public ChatService(ChatClient.Builder chatClientBuilder, ConversationRepository conversationRepository) {
        this.chatClient = chatClientBuilder.build();
        this.conversationRepository = conversationRepository;
    }

    @Transactional
    public String generateResponse(String message, String conversationId) {
        // Fallback for single-shot calls without a persistent conversation ID
        if (conversationId == null || conversationId.trim().isEmpty()) {
            try {
                return chatClient
                        .prompt()
                        .user(message)
                        .call()
                        .content();
            } catch (Exception e) {
                return "The AI assistant is temporarily unavailable. Please verify that a valid GEMINI_API_KEY is configured in your backend environment.";
            }
        }

        // 1. Find or create existing conversation
        Conversation conversation = conversationRepository
                .findByConversationId(conversationId)
                .orElseGet(() -> conversationRepository.save(new Conversation(conversationId)));

        // 2. Save user message
        Message userMessage = new Message(MessageRole.USER, message);
        conversation.addMessage(userMessage);
        conversationRepository.save(conversation);

        // 3. Get previous conversation messages
        List<Message> messages = conversation.getMessages();

        // 4. Build context
        StringBuilder context = new StringBuilder();
        for (Message msg : messages) {
            context.append(msg.getRole())
                    .append(": ")
                    .append(msg.getContent())
                    .append("\n");
        }

        // 5. Send context + current question to Gemini
        String prompt = """
                You are a helpful AI assistant.
                Here is the conversation history:
                %s
                Continue the conversation naturally.
                Current user message:
                %s
                """.formatted(context, message);

        String response;
        try {
            response = chatClient
                    .prompt()
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            response = "The AI assistant is temporarily unavailable. Please verify that a valid GEMINI_API_KEY is configured in your backend environment.";
        }

        // 6. Save AI response
        Message assistantMessage = new Message(MessageRole.ASSISTANT, response);
        conversation.addMessage(assistantMessage);
        conversationRepository.save(conversation);

        // 7. Return response
        return response;
    }

    public String generateResponse(String message) {
        return generateResponse(message, null);
    }
}
