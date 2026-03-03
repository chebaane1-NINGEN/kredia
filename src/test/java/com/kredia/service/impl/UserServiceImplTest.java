package com.kredia.service.impl;

import com.kredia.dto.UserRequestDTO;
import com.kredia.entity.User;
import com.kredia.entity.UserRole;
import com.kredia.entity.UserStatus;
import com.kredia.exception.BusinessException;
import com.kredia.mapper.UserMapper;
import com.kredia.repository.UserActivityRepository;
import com.kredia.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        UserMapper realMapper = new UserMapper();
        userService = new UserServiceImpl(userRepository, realMapper, userActivityRepository);
    }

    @Test
    void delete_shouldFail_whenDeletingLastAdmin() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        admin.setDeleted(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN)).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.delete(1L));
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

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.block(1L));
        assertEquals("Cannot block last ADMIN", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeRole_shouldFail_whenAssigningAdminToNonActive() {
        User u = new User();
        u.setId(10L);
        u.setDeleted(false);
        u.setRole(UserRole.CLIENT);
        u.setStatus(UserStatus.INACTIVE);

        when(userRepository.findById(10L)).thenReturn(Optional.of(u));

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.changeRole(10L, UserRole.ADMIN));
        assertEquals("Only ACTIVE users can be assigned ADMIN role", ex.getMessage());
    }

    @Test
    void mutate_shouldFail_whenUserDeleted() {
        User deleted = new User();
        deleted.setId(20L);
        deleted.setDeleted(true);

        when(userRepository.findById(20L)).thenReturn(Optional.of(deleted));

        BusinessException ex = assertThrows(BusinessException.class, () -> userService.deactivate(20L));
        assertEquals("Deleted user cannot be modified; restore first", ex.getMessage());
    }

    @Test
    void search_shouldIncludeNotDeletedSpecification() {
        when(userRepository.findAll(org.mockito.ArgumentMatchers.<Specification<User>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        userService.search(
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Pageable.ofSize(10)
        );

        verify(userRepository).findAll(org.mockito.ArgumentMatchers.<Specification<User>>any(), any(Pageable.class));
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
