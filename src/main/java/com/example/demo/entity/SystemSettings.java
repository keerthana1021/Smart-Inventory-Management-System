package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {

    @Id
    private String id;

    private String settingKey;
    private String settingValue;
    private String description;
    private String dataType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
