package com.example.demo.service;

import com.example.demo.dto.NotificationPushDto;
import com.example.demo.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationPushService {

    public static final String TOPIC_NOTIFICATIONS = "/topic/notifications";

    private final SimpMessagingTemplate messagingTemplate;

    public void pushToAll(Notification notification) {
        NotificationPushDto dto = toDto(notification);
        messagingTemplate.convertAndSend(TOPIC_NOTIFICATIONS, dto);
    }

    public void pushToUser(String userId, Notification notification) {
        NotificationPushDto dto = toDto(notification);
        messagingTemplate.convertAndSend("/queue/notifications-" + userId, dto);
    }

    private static NotificationPushDto toDto(Notification n) {
        return NotificationPushDto.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType() != null ? n.getType().name() : null)
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
