package com.hrkms.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage();
        HttpStatus status;

        // Map specific error messages to HTTP status codes
        if (message.contains("không tồn tại") || message.contains("Không tìm thấy") || message.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (message.contains("không có quyền") || message.contains("Chỉ Admin")) {
            status = HttpStatus.FORBIDDEN;
        } else if (message.contains("Token") || message.contains("Phiên đăng nhập") || message.contains("Mật khẩu không đúng")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (message.contains("đã tồn tại") || message.contains("không hợp lệ") || message.contains("Không thể xóa")) {
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message
        ));
    }
}
