package com.smartsupply.controller;

import com.smartsupply.dto.AiChatRequest;
import com.smartsupply.dto.AiChatResponse;
import com.smartsupply.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        String response = aiService.generateResponse(request.getMessage());
        return ResponseEntity.ok(new AiChatResponse(response));
    }
}
