package com.example.demo.repository;

import com.example.demo.entity.SystemSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SystemSettingsRepository extends MongoRepository<SystemSettings, String> {
    Optional<SystemSettings> findBySettingKey(String key);
}
