package com.hrkms.config;

import com.hrkms.service.AiProviderService;
import com.hrkms.service.LocalAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Value("${ai.local.base-url:http://localhost:1234}")
    private String localBaseUrl;

    @Value("${ai.local.model:qwen3.5-9b}")
    private String localModel;

    @Bean
    public AiProviderService aiProviderService() {
        return new LocalAiService(localBaseUrl, localModel);
    }
}
