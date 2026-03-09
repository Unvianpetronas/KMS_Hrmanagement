package com.hrkms.service;

import com.hrkms.dto.ChatDTO;
import com.hrkms.model.KnowledgeItem;
import com.hrkms.repository.KnowledgeItemRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    private static final int MAX_HISTORY = 8;
    private static final double SCORE_THRESHOLD = 0.05;
    private static final int TOP_DOCS = 3;
    private static final int MAX_CONTENT_CHARS = 800;

    private final KnowledgeItemRepository itemRepo;
    private final AiProviderService aiProvider;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "shall", "can", "tôi", "bạn", "của", "và",
            "là", "có", "được", "cho", "với", "trong", "về", "để", "không",
            "this", "that", "what", "how", "when", "where", "who", "which", "i",
            "my", "your", "to", "of", "in", "on", "at", "by", "for"
    );

    public ChatDTO.ChatResponse chat(String userMessage, List<Map<String, String>> history) {
        List<KnowledgeItem> relevant = findRelevantItems(userMessage);
        String systemPrompt = buildSystemPrompt(relevant);

        List<Map<String, String>> trimmedHistory = history != null && history.size() > MAX_HISTORY
                ? history.subList(history.size() - MAX_HISTORY, history.size())
                : (history != null ? history : new ArrayList<>());

        String answer;
        try {
            answer = aiProvider.chat(systemPrompt, userMessage, trimmedHistory);
        } catch (Exception e) {
            logger.error("AI provider error: {}", e.getMessage());
            answer = "Xin lỗi, hiện tại không thể kết nối đến AI. Vui lòng thử lại sau.";
        }

        List<ChatDTO.SourceDoc> sourceDocs = relevant.stream()
                .map(i -> new ChatDTO.SourceDoc(i.getId(), i.getTitle()))
                .collect(Collectors.toList());

        return new ChatDTO.ChatResponse(answer, sourceDocs, aiProvider.getModelName());
    }

    private List<KnowledgeItem> findRelevantItems(String question) {
        List<String> tokens = tokenize(question);
        if (tokens.isEmpty()) return List.of();

        List<KnowledgeItem> published = itemRepo.findByStatus("Published");

        return published.stream()
                .map(item -> {
                    double score = 0;
                    String titleLower = item.getTitle().toLowerCase();
                    String contentLower = item.getContent() != null ? item.getContent().toLowerCase() : "";
                    List<String> tagNames = item.getTags().stream()
                            .map(t -> t.getName().toLowerCase())
                            .collect(Collectors.toList());
                    int contentWords = contentLower.isBlank() ? 1 : contentLower.split("\\s+").length;
                    for (String token : tokens) {
                        if (titleLower.contains(token)) score += 3.0;
                        if (tagNames.stream().anyMatch(t -> t.contains(token))) score += 2.0;
                        long occurrences = Arrays.stream(contentLower.split("\\s+"))
                                .filter(w -> w.contains(token)).count();
                        score += (double) occurrences / contentWords;
                    }
                    return Map.entry(item, score);
                })
                .filter(e -> e.getValue() > SCORE_THRESHOLD)
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(TOP_DOCS)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private String buildSystemPrompt(List<KnowledgeItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là trợ lý HR chuyên nghiệp. Hãy trả lời câu hỏi DỰA TRÊN các tài liệu HR được cung cấp bên dưới.\n");
        sb.append("Quy tắc:\n");
        sb.append("- Chỉ trả lời dựa trên nội dung tài liệu. Đừng bịa đặt thông tin.\n");
        sb.append("- Luôn trích dẫn ID tài liệu (ví dụ: POL-001) khi trả lời.\n");
        sb.append("- Nếu không tìm thấy thông tin trong tài liệu, hãy nói rõ điều đó.\n");
        sb.append("- Trả lời ngắn gọn, rõ ràng bằng tiếng Việt.\n\n");
        if (items.isEmpty()) {
            sb.append("Không tìm thấy tài liệu liên quan.\n");
        } else {
            sb.append("TÀI LIỆU THAM KHẢO:\n\n");
            for (KnowledgeItem item : items) {
                sb.append("--- [").append(item.getId()).append("] ").append(item.getTitle()).append(" ---\n");
                String content = item.getContent() != null ? item.getContent() : "";
                if (content.length() > MAX_CONTENT_CHARS) content = content.substring(0, MAX_CONTENT_CHARS) + "...";
                sb.append(content).append("\n\n");
            }
        }
        return sb.toString();
    }

    private List<String> tokenize(String text) {
        return Arrays.stream(text.toLowerCase().split("[\\s\\p{Punct}]+"))
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w))
                .distinct()
                .collect(Collectors.toList());
    }
}
