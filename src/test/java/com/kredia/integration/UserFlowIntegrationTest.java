package com.kredia.integration;

import com.kredia.dto.UserRequestDTO;
import com.kredia.dto.UserResponseDTO;
import com.kredia.entity.UserActivity;
import com.kredia.entity.UserActivityActionType;
import com.kredia.entity.UserRole;
import com.kredia.exception.BusinessException;
import com.kredia.repository.UserActivityRepository;
import com.kredia.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class UserFlowIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Test
    @Transactional
    void fullFlow_shouldPersistActivities_andEnforceInvariants() {
        UserResponseDTO adminCreated = userService.create(build("admin@kredia.com", "Admin", "One", "0600001111"));
        Long adminId = adminCreated.getId();
        userService.activate(adminId);
        userService.changeRole(adminId, UserRole.ADMIN);

        UserResponseDTO client = userService.create(build("client@kredia.com", "Client", "One", "0600002222"));
        client = userService.activate(client.getId());

        client = userService.block(client.getId());

        userService.delete(client.getId());
        UserResponseDTO restored = userService.restore(client.getId());
        assertFalse(restored.isDeleted());

        BusinessException downgradeLastAdmin = assertThrows(BusinessException.class,
                () -> userService.changeRole(adminId, UserRole.CLIENT));
        assertEquals("Cannot downgrade last ADMIN", downgradeLastAdmin.getMessage());

        List<UserActivity> adminActs = userActivityRepository.findByUserIdOrderByTimestampAsc(adminId);
        assertTrue(adminActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.CREATED));
        assertTrue(adminActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.STATUS_CHANGED));
        assertTrue(adminActs.stream().anyMatch(a -> a.getActionType() == UserActivityActionType.ROLE_CHANGED));

        List<UserActivity> clientActs = userActivityRepository.findByUserIdOrderByTimestampAsc(client.getId());
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
