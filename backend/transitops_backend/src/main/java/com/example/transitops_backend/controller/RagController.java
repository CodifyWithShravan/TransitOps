package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.ChatRequest;
import com.example.transitops_backend.service.PdfService;
import com.example.transitops_backend.service.RagChatService;
import com.example.transitops_backend.service.TextChunkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"})
public class RagController {

    private static final Logger log = LoggerFactory.getLogger(RagController.class);

    private final PdfService pdfService;
    private final TextChunkService textChunkService;
    private final VectorStore vectorStore;
    private final RagChatService ragChatService;

    public RagController(
            PdfService pdfService,
            TextChunkService textChunkService,
            VectorStore vectorStore,
            RagChatService ragChatService) {
        this.pdfService = pdfService;
        this.textChunkService = textChunkService;
        this.vectorStore = vectorStore;
        this.ragChatService = ragChatService;
    }

    // =========================================================
    // PDF UPLOAD + RAG INGESTION
    // =========================================================
    @PostMapping("/upload")
    public ResponseEntity<String> uploadDocument(@RequestParam("file") MultipartFile file) {
        // 1. Check file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a PDF file.");
        }

        // 2. Check PDF
        if (!"application/pdf".equals(file.getContentType())) {
            return ResponseEntity.badRequest().body("Only PDF files are allowed.");
        }

        try {
            // 3. Extract PDF text
            String text = pdfService.extractText(file);
            log.info("Extracted characters from PDF: {}", text.length());

            // 4. Split text into chunks
            List<Document> chunks = textChunkService.splitText(text);
            log.info("Total chunks generated: {}", chunks.size());

            // 5. Generate embeddings + store in VectorStore (Pinecone / Local)
            vectorStore.add(chunks);

            // 6. Enable RAG only after successful storage
            ragChatService.enableRag();
            log.info("Successfully stored {} chunks in VectorStore.", chunks.size());

            // 7. Response
            return ResponseEntity.ok(
                    "PDF processed successfully. "
                            + "Extracted characters: " + text.length()
                            + ", Total chunks: " + chunks.size()
                            + ", Stored in VectorStore successfully."
            );
        } catch (IOException e) {
            log.error("Failed to read PDF: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to read PDF.");
        } catch (Exception e) {
            log.error("Error storing embeddings in VectorStore: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("PDF processed, but failed to store embeddings in VectorStore.");
        }
    }

    // =========================================================
    // CHAT (Gemini directly OR VectorStore RAG -> Gemini)
    // =========================================================
    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest request) {
        // 1. Validate message
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message cannot be empty.");
        }

        try {
            // 2. Query RAG service
            String answer = ragChatService.askQuestion(request.getMessage());
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            log.error("Failed to process chat message: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to process your message.");
        }
    }
}
