package com.example.demo.controller;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.JwtResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.setup.secret:setup}")
    private String setupSecret;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /** Admin resets another user's password. */
    @PostMapping("/admin/reset-password")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminResetPassword(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String newPassword = body.get("newPassword");
        if (userId == null || userId.isBlank() || newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("message", "userId and newPassword (min 6 chars) required"));
        authService.adminResetPassword(userId, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    /** Call this once from Postman if login fails: POST body {"secret": "setup"} to create/reset admin (password: admin123) */
    @PostMapping("/setup")
    public ResponseEntity<Map<String, String>> setup(@RequestBody Map<String, String> body) {
        if (!setupSecret.equals(body.get("secret"))) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid secret"));
        }
        authService.setupAdminUser();
        return ResponseEntity.ok(Map.of("message", "Admin user ready. Login with username: admin, password: admin123"));
    }
}
