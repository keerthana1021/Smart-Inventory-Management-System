package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.mail.host")
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.low-stock.email-enabled:false}")
    private boolean emailEnabled;

    @Value("${app.low-stock.email-from:inventory@localhost}")
    private String fromEmail;

    public void sendLowStockAlert(List<String> toEmails, String subject, String body) {
        if (!emailEnabled || toEmails == null || toEmails.isEmpty()) return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(toEmails.toArray(new String[0]));
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Low-stock email sent to {} recipients", toEmails.size());
        } catch (Exception e) {
            log.warn("Failed to send low-stock email: {}", e.getMessage());
        }
    }
}
