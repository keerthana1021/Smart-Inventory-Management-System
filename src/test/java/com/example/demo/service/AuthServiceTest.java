package com.example.demo.service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    @Test
    void changePassword_success() {
        User user = User.builder().id("u1").username("admin").password("hashed").build();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("newHashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", "newPass");
        authService.changePassword("admin", req);

        verify(userRepository).save(user);
        assertEquals("newHashed", user.getPassword());
    }

    @Test
    void changePassword_wrongCurrent_throws() {
        User user = User.builder().id("u1").username("admin").password("hashed").build();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "hashed")).thenReturn(false);

        ChangePasswordRequest req = new ChangePasswordRequest("wrongPass", "newPass");
        assertThrows(BadRequestException.class, () -> authService.changePassword("admin", req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_userNotFound_throws() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        ChangePasswordRequest req = new ChangePasswordRequest("old", "new");
        assertThrows(BadRequestException.class, () -> authService.changePassword("unknown", req));
    }
}
