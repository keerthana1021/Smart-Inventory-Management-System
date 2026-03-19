package com.example.demo.service;

import com.example.demo.dto.CreateUserRequest;
import com.example.demo.dto.PageResponse;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ConflictException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public PageResponse<UserResponse> findAll(String search, Pageable pageable) {
        Page<User> page;
        if (search != null && !search.isBlank()) {
            String s = search.trim();
            page = userRepository.findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(s, s, s, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }
        List<UserResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }

    public UserResponse getById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new ConflictException("Username already exists: " + request.getUsername());
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail()))
            throw new ConflictException("Email already exists: " + request.getEmail());

        Set<Role> roles = resolveRoles(request.getRoles());
        var now = LocalDateTime.now();
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .enabled(request.isEnabled())
                .roles(roles)
                .createdAt(now)
                .updatedAt(now)
                .build();
        user = userRepository.save(user);
        auditService.log("CREATE_USER", "User", user.getId(), null, user.getUsername());
        return toResponse(user);
    }

    public UserResponse update(String id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            userRepository.findByEmail(request.getEmail())
                    .filter(u -> !u.getId().equals(id))
                    .ifPresent(u -> { throw new ConflictException("Email already in use"); });
            user.setEmail(request.getEmail());
        }
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEnabled() != null) user.setEnabled(request.getEnabled());
        if (request.getRoles() != null) user.setRoles(resolveRoles(request.getRoles()));
        if (request.getPassword() != null && !request.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        auditService.log("UPDATE_USER", "User", user.getId(), null, user.getUsername());
        return toResponse(user);
    }

    public void delete(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if ("admin".equalsIgnoreCase(user.getUsername()))
            throw new BadRequestException("Cannot delete the admin user");
        userRepository.delete(user);
        auditService.log("DELETE_USER", "User", id, user.getUsername(), null);
    }

    public List<UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty())
            return new HashSet<>();
        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            try {
                Role.RoleName rn = Role.RoleName.valueOf(name.toUpperCase());
                roleRepository.findByName(rn).ifPresent(roles::add);
            } catch (IllegalArgumentException ignored) {}
        }
        return roles;
    }

    private UserResponse toResponse(User user) {
        Set<String> roleNames = user.getRoles() != null
                ? user.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toSet())
                : Set.of();
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .enabled(user.isEnabled())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
