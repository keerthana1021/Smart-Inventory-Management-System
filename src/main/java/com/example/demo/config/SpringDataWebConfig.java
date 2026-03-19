package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * Enables stable JSON serialization for Page responses (PageImpl → PagedModel).
 * Removes the warning: "Serializing PageImpl instances as-is is not supported..."
 */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class SpringDataWebConfig {
}
