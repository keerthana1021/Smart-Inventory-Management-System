package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> index() {
        return ResponseEntity.ok(Map.of(
                "message", "Smart Inventory Management API",
                "login", "POST /api/v1/auth/login with {\"username\":\"admin\",\"password\":\"admin123\"}",
                "setup", "If login fails: POST /api/v1/auth/setup with {\"secret\":\"setup\"} then try login again"
        ));
    }
}
