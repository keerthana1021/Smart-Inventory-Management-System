package com.example.demo.config;

import com.example.demo.entity.Role;
import com.example.demo.entity.Supplier;
import com.example.demo.entity.Warehouse;
import com.example.demo.entity.SystemSettings;
import com.example.demo.entity.User;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.SupplierRepository;
import com.example.demo.repository.WarehouseRepository;
import com.example.demo.repository.SystemSettingsRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Override
    public void run(String... args) {
        // Ensure roles exist
        var adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.ADMIN).build()));
        roleRepository.findByName(Role.RoleName.MANAGER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.MANAGER).build()));
        roleRepository.findByName(Role.RoleName.STAFF)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.STAFF).build()));

        String initialAdminPassword = environment.getProperty("app.admin.initial-password", "admin123");
        boolean resetAdminOnStart = Boolean.parseBoolean(
                environment.getProperty("app.admin.reset-on-start", "false")
        );

        // Ensure admin user exists; optional reset controlled by app.admin.reset-on-start.
        var adminOpt = userRepository.findByUsername("admin");
        var now = LocalDateTime.now();
        if (adminOpt.isEmpty()) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@inventory.com")
                    .password(passwordEncoder.encode(initialAdminPassword))
                    .fullName("System Administrator")
                    .roles(Set.of(adminRole))
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        } else if (resetAdminOnStart) {
            User admin = adminOpt.get();
            admin.setPassword(passwordEncoder.encode(initialAdminPassword));
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }

        // Default system settings (only if not already present)
        seedSetting("TAX_RATE", "0.18", "GST rate (e.g. 18%)", "NUMBER");
        seedSetting("CURRENCY", "INR", "Default currency code", "STRING");
        seedSetting("WAREHOUSE_LOCATION", "Main Warehouse", "Primary warehouse name", "STRING");
        seedSetting("DEFAULT_REORDER_THRESHOLD", "10", "Default reorder level for new products", "NUMBER");

        // Default warehouse when none exist
        if (warehouseRepository.count() == 0) {
            var n = LocalDateTime.now();
            warehouseRepository.save(Warehouse.builder()
                    .name("Main Warehouse")
                    .code("WH-MAIN")
                    .address("")
                    .createdAt(n)
                    .updatedAt(n)
                    .build());
        }

        // One default supplier when none exist
        if (supplierRepository.count() == 0) {
            var n = LocalDateTime.now();
            supplierRepository.save(Supplier.builder()
                    .name("Default Supplier")
                    .contactPerson("Contact")
                    .email("supplier@example.com")
                    .phone("+91-9876543210")
                    .address("")
                    .createdAt(n)
                    .updatedAt(n)
                    .build());
        }
    }

    private void seedSetting(String key, String value, String description, String dataType) {
        if (systemSettingsRepository.findBySettingKey(key).isEmpty()) {
            var n = LocalDateTime.now();
            systemSettingsRepository.save(SystemSettings.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .description(description)
                    .dataType(dataType)
                    .createdAt(n)
                    .updatedAt(n)
                    .build());
        }
    }
}
