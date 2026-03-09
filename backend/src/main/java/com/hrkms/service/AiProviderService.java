package com.hrkms.service;

import java.util.List;
import java.util.Map;

public interface AiProviderService {
    String chat(String systemPrompt, String userMessage, List<Map<String, String>> history);
    String getModelName();
}
