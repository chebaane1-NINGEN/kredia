package com.kredia.service.impl;

import com.kredia.service.impl.user.UserServiceImpl;

import com.kredia.dto.user.UserRequestDTO;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import com.kredia.exception.BusinessException;
import com.kredia.mapper.user.UserMapper;
import com.kredia.repository.user.KycDocumentRepository;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("all")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private KycDocumentRepository kycDocumentRepository;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        UserMapper realMapper = new UserMapper();
        userService = new UserServiceImpl(userRepository, realMapper, userActivityRepository, kycDocumentRepository);
    }

    @Test
    void delete_shouldFail_whenDeletingLastAdmin() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setDeleted(false);

        User target = new User();
        target.setId(2L);
        target.setRole(UserRole.ADMIN);
        target.setDeleted(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN)).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.delete(1L, 2L));
        assertEquals("Cannot delete last ADMIN", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void block_shouldFail_whenBlockingLastAdmin() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setDeleted(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN)).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.block(1L, 1L));
        assertEquals("Cannot block last ADMIN", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeRole_shouldFail_whenAssigningAdminToNonActive() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setDeleted(false);

        User u = new User();
        u.setId(10L);
        u.setDeleted(false);
        u.setRole(UserRole.CLIENT);
        u.setStatus(UserStatus.INACTIVE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(10L)).thenReturn(Optional.of(u));

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.changeRole(1L, 10L, UserRole.ADMIN));
        assertEquals("Only ACTIVE users can be assigned ADMIN role", ex.getMessage());
    }

    @Test
    void mutate_shouldFail_whenUserDeleted() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setDeleted(false);

        User deleted = new User();
        deleted.setId(20L);
        deleted.setDeleted(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.findById(20L)).thenReturn(Optional.of(deleted));

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.deactivate(1L, 20L));
        assertEquals("Deleted user cannot be modified; restore first", ex.getMessage());
    }

    @Test
    void search_shouldIncludeNotDeletedSpecification() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setDeleted(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        Page<User> page = new PageImpl<>(List.of());
        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), any(Pageable.class)))
                .thenReturn(page);

        userService.search(
                1L,
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Pageable.ofSize(10)
        );

        verify(userRepository).findAll(ArgumentMatchers.<Specification<User>>any(), any(Pageable.class));
    }

    @Test
    void create_shouldRejectDuplicateEmail() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setEmail("dup@kredia.com");
        dto.setFirstName("A");
        dto.setLastName("B");
        dto.setPhoneNumber("0600000999");

        when(userRepository.existsByEmailAndDeletedFalse("dup@kredia.com")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.create(dto));
        assertEquals("Email already exists", ex.getMessage());
    }
}
