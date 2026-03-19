package com.example.demo.controller;

import com.example.demo.entity.SystemSettings;
import com.example.demo.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemSettingsController {

    private final SystemSettingsRepository systemSettingsRepository;

    @GetMapping
    public List<SystemSettings> list() {
        return systemSettingsRepository.findAll();
    }

    @GetMapping("/{key}")
    public ResponseEntity<SystemSettings> get(@PathVariable String key) {
        return ResponseEntity.of(systemSettingsRepository.findBySettingKey(key));
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemSettings> update(@PathVariable String key, @RequestBody Map<String, String> body) {
        var opt = systemSettingsRepository.findBySettingKey(key);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var s = opt.get();
        s.setSettingValue(body.get("settingValue"));
        s.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(systemSettingsRepository.save(s));
    }
}
