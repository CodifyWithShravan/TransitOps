package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.ChatRequest;
import com.example.transitops_backend.dto.ChatResponse;
import com.example.transitops_backend.service.ChatService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"})
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = chatService.generateResponse(
                request.getMessage(),
                request.getConversationId()
        );
        return new ChatResponse(response);
    }
}
