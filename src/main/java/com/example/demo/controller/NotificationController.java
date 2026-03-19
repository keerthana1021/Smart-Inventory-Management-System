package com.example.demo.controller;

import com.example.demo.entity.Notification;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal UserPrincipal user,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size,
                                  @RequestParam(required = false) Boolean unreadOnly) {
        if (user == null) return ResponseEntity.ok(List.of());
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (Boolean.TRUE.equals(unreadOnly))
            return ResponseEntity.ok(notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(user.getId(), false, pageable));
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) return ResponseEntity.ok(Map.of("count", 0L));
        long count = notificationRepository.countByUserIdAndRead(user.getId(), false);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable String id, @AuthenticationPrincipal UserPrincipal user) {
        Notification n = notificationRepository.findById(id).orElseThrow();
        if (user != null && n.getUserId() != null && n.getUserId().equals(user.getId())) {
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }
        return ResponseEntity.notFound().build();
    }
}
