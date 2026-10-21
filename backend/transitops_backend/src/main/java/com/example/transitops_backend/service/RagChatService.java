package com.example.transitops_backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RagChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    // RAG is disabled until a PDF is successfully uploaded
    private volatile boolean ragEnabled = false;

    public RagChatService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore) {
        this.chatClient = chatClientBuilder.build();
        this.vectorStore = vectorStore;
    }

    // =========================================================
    // ENABLE RAG AFTER SUCCESSFUL PDF UPLOAD
    // =========================================================
    public void enableRag() {
        this.ragEnabled = true;
    }

    public boolean isRagEnabled() {
        return this.ragEnabled;
    }

    // =========================================================
    // CHAT
    // =========================================================
    public String askQuestion(String message) {
        // =====================================================
        // NORMAL CHAT (No PDF uploaded yet)
        // =====================================================
        if (!ragEnabled) {
            try {
                return chatClient.prompt()
                        .user(message)
                        .call()
                        .content();
            } catch (Exception e) {
                return "The AI assistant is temporarily unavailable. Please verify that a valid GEMINI_API_KEY is configured in your backend environment.";
            }
        }

        // =====================================================
        // RAG CHAT (PDF has been uploaded)
        // =====================================================
        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(message)
                        .topK(3)
                        .build()
        );

        // =====================================================
        // NO RELEVANT PDF INFORMATION
        // =====================================================
        if (documents == null || documents.isEmpty()) {
            return chatClient.prompt()
                    .user("""
                            Answer the user's question normally.
                            There was no relevant information found in the uploaded document.
                            USER QUESTION:
                            %s
                            """.formatted(message))
                    .call()
                    .content();
        }

        // =====================================================
        // COMBINE RETRIEVED PDF CHUNKS
        // =====================================================
        String context = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n---\n\n"));

        // =====================================================
        // RAG PROMPT
        // =====================================================
        String prompt = """
                You are an AI assistant with access to an uploaded PDF.
                If the user's question is related to the uploaded PDF, answer using the document context.
                If the question is unrelated to the PDF, answer normally.
                Do not invent information from the document.
                DOCUMENT CONTEXT:
                %s
                USER QUESTION:
                %s
                """.formatted(context, message);

        // =====================================================
        // GEMINI FINAL ANSWER
        // =====================================================
        try {
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            return "The AI assistant is temporarily unavailable. Please verify that a valid GEMINI_API_KEY is configured in your backend environment.";
        }
    }
}
