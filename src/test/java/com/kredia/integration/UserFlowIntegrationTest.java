package com.kredia.integration;

import com.kredia.dto.user.UserRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserRole;
import com.kredia.exception.BusinessException;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserStatus;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@SuppressWarnings("all")
class UserFlowIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Test
    @Transactional
    void fullFlow_shouldPersistActivities_andEnforceInvariants() {
        // Create first user
        UserResponseDTO firstUser = userService.create(build("admin@kredia.com", "Admin", "One", "0600001111"));
        Long adminId = firstUser.getId();
        
        // Bootstrap: Manual promotion to ADMIN for testing
        User adminEntity = userRepository.findById(adminId).get();
        adminEntity.setStatus(UserStatus.ACTIVE);
        adminEntity.setRole(UserRole.ADMIN);
        userRepository.save(adminEntity);

        // Subsequent calls use adminId as actorId
        UserResponseDTO client = userService.create(build("client@kredia.com", "Client", "One", "0600002222"));
        Long clientId = client.getId();
        
        userService.activate(adminId, clientId);
        userService.block(adminId, clientId);
        userService.delete(adminId, clientId);
        
        UserResponseDTO restored = userService.restore(adminId, clientId);
        assertFalse(restored.isDeleted());

        BusinessException downgradeLastAdmin = assertThrows(BusinessException.class,
                () -> userService.changeRole(adminId, adminId, UserRole.CLIENT));
        assertEquals("Cannot downgrade last ADMIN", downgradeLastAdmin.getMessage());

        List<UserActivity> adminActs = userActivityRepository.findByUserIdOrderByTimestampAsc(adminId);
        assertTrue(adminActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.CREATED));

        List<UserActivity> clientActs = userActivityRepository.findByUserIdOrderByTimestampAsc(clientId);
        assertTrue(clientActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.CREATED));
        assertTrue(clientActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.STATUS_CHANGED));
        assertTrue(clientActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.DELETED));
        assertTrue(clientActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.RESTORED));
    }

    private static UserRequestDTO build(String email, String firstName, String lastName, String phone) {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setEmail(email);
        dto.setFirstName(firstName);
        dto.setLastName(lastName);
        dto.setPhoneNumber(phone);
        return dto;
    }
}
