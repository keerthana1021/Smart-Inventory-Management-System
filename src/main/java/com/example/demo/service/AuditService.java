package com.example.demo.service;

import com.example.demo.entity.AuditLog;
import com.example.demo.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String action, String entityType, String entityId, String oldValue, String newValue) {
        String userId = null;
        String username = null;
        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof com.example.demo.security.UserPrincipal principal) {
            userId = principal.getId();
            username = principal.getUsername();
        }
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    public void logLogin(String username) {
        log("LOGIN", "User", null, null, username);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> findAll(String action, String entityType, String userId, LocalDate from, LocalDate to, Pageable pageable) {
        if (userId != null && !userId.isBlank()) {
            var page = auditLogRepository.findByUserId(userId, pageable);
            if (from != null && to != null) {
                var fromDt = from.atStartOfDay();
                var toDt = to.plusDays(1).atStartOfDay();
                var filtered = page.getContent().stream()
                        .filter(l -> l.getCreatedAt() != null && !l.getCreatedAt().isBefore(fromDt) && l.getCreatedAt().isBefore(toDt))
                        .toList();
                return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
            }
            return page;
        }
        if (from != null && to != null) {
            var fromDt = from.atStartOfDay();
            var toDt = to.plusDays(1).atStartOfDay();
            return auditLogRepository.findByCreatedAtBetween(fromDt, toDt, pageable);
        }
        if (action != null && !action.isBlank() && entityType != null && !entityType.isBlank())
            return auditLogRepository.findByActionContainingIgnoreCaseAndEntityType(action.trim(), entityType.trim(), pageable);
        if (action != null && !action.isBlank())
            return auditLogRepository.findByActionContainingIgnoreCase(action.trim(), pageable);
        if (entityType != null && !entityType.isBlank())
            return auditLogRepository.findByEntityType(entityType.trim(), pageable);
        return auditLogRepository.findAll(pageable);
    }
}
