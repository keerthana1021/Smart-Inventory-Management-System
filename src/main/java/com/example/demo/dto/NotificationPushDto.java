package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPushDto {
    private String id;
    private String userId;
    private String title;
    private String message;
    private String type;
    private String referenceType;
    private String referenceId;
    private LocalDateTime createdAt;
}
