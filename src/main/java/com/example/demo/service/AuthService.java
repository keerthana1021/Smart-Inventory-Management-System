package com.example.demo.service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.JwtResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public JwtResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        String token = jwtUtil.generateToken(auth);
        auditService.logLogin(principal.getUsername());
        Set<String> roles = principal.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());
        return JwtResponse.builder()
                .token(token)
                .id(principal.getId())
                .username(principal.getUsername())
                .email(principal.getEmail())
                .fullName(principal.getFullName() != null ? principal.getFullName() : principal.getUsername())
                .roles(roles)
                .build();
    }

    /** Creates or resets admin user (password: admin123). Call from Postman if login fails. */
    public void setupAdminUser() {
        var adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.ADMIN).build()));
        roleRepository.findByName(Role.RoleName.MANAGER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.MANAGER).build()));
        roleRepository.findByName(Role.RoleName.STAFF)
                .orElseGet(() -> roleRepository.save(Role.builder().name(Role.RoleName.STAFF).build()));

        var now = LocalDateTime.now();
        var adminOpt = userRepository.findByUsername("admin");
        if (adminOpt.isEmpty()) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@inventory.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .roles(Set.of(adminRole))
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        } else {
            User admin = adminOpt.get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setUpdatedAt(now);
            userRepository.save(admin);
        }
    }

    /** Change password for the authenticated user. */
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new BadRequestException("Current password is incorrect");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.log("CHANGE_PASSWORD", "User", user.getId(), null, username);
    }

    /** Admin resets a user's password (forgot password flow). */
    public void adminResetPassword(String userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.log("ADMIN_RESET_PASSWORD", "User", user.getId(), null, user.getUsername());
    }
}
