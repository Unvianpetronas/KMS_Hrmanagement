package com.hrkms.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Local AI provider using OpenAI-compatible API.
 * Works with LM Studio (default port 1234) and Ollama (/v1/chat/completions endpoint).
 * Instantiated by AiConfig based on ai.provider=local
 */
public class LocalAiService implements AiProviderService {

    private final String baseUrl;
    private final String model;
    private final RestTemplate restTemplate = new RestTemplate();

    public LocalAiService(String baseUrl, String model) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String chat(String systemPrompt, String userMessage, List<Map<String, String>> history) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null) messages.addAll(history);
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.3,
                "stream", false
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<?, ?> response = restTemplate.postForObject(
                baseUrl + "/v1/chat/completions", entity, Map.class);

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, String> message = (Map<String, String>) choices.get(0).get("message");
        String content = message.get("content");
        // Strip <think>...</think> block used by reasoning models (e.g. Qwen 3.5)
        int thinkEnd = content.indexOf("</think>");
        if (thinkEnd != -1) {
            content = content.substring(thinkEnd + 8).trim();
        }
        return content;
    }

    @Override
    public String getModelName() {
        return model + " (local)";
    }
}
