package com.kredia.mapper.user;

import com.kredia.dto.user.ClientProfileUpdateDTO;
import com.kredia.dto.user.AdminUserUpdateDTO;
import com.kredia.dto.user.UserRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.entity.user.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntityForCreate(UserRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        User u = new User();
        u.setEmail(dto.getEmail());
        u.setFirstName(dto.getFirstName());
        u.setLastName(dto.getLastName());
        u.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getPassword() != null) u.setPasswordHash(dto.getPassword());
        if (dto.getRole() != null) u.setRole(dto.getRole());
        if (dto.getStatus() != null) u.setStatus(dto.getStatus());
        return u;
    }

    public void copyUpdatableFields(UserRequestDTO dto, User target) {
        if (dto == null || target == null) {
            return;
        }
        target.setEmail(dto.getEmail());
        target.setFirstName(dto.getFirstName());
        target.setLastName(dto.getLastName());
        target.setPhoneNumber(dto.getPhoneNumber());
    }

    public void copyClientProfileFields(ClientProfileUpdateDTO dto, User target) {
        if (dto == null || target == null) return;
        if (dto.getFirstName() != null) target.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) target.setLastName(dto.getLastName());
        if (dto.getPhoneNumber() != null) target.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getDateOfBirth() != null) target.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getAddress() != null) target.setAddress(dto.getAddress());
        if (dto.getGender() != null) target.setGender(dto.getGender());
    }

    public void copyAdminUserFields(AdminUserUpdateDTO dto, User target) {
        if (dto == null || target == null) return;
        target.setEmail(dto.getEmail());
        target.setFirstName(dto.getFirstName());
        target.setLastName(dto.getLastName());
        target.setPhoneNumber(dto.getPhoneNumber());
        target.setDateOfBirth(dto.getDateOfBirth());
        target.setAddress(dto.getAddress());
        target.setGender(dto.getGender());
        target.setRole(dto.getRole());
        target.setStatus(dto.getStatus());
    }

    public UserResponseDTO toResponse(User user) {
        if (user == null) {
            return null;
        }
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setStatus(user.getStatus());
        dto.setRole(user.getRole());
        dto.setDeleted(user.isDeleted());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setCreatedBy(user.getCreatedBy());
        dto.setUpdatedBy(user.getUpdatedBy());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setGender(user.getGender());
        
        if (user.getAssignedAgent() != null) {
            dto.setAssignedAgentId(user.getAssignedAgent().getId());
            dto.setAssignedAgentName(user.getAssignedAgent().getFirstName() + " " + user.getAssignedAgent().getLastName());
        }
        
        return dto;
    }

    public UserActivityResponseDTO toActivityResponse(com.kredia.entity.user.UserActivity activity) {
        if (activity == null) return null;
        UserActivityResponseDTO dto = new UserActivityResponseDTO();
        dto.setId(activity.getId());
        dto.setUserId(activity.getUserId());
        dto.setActionType(activity.getActionType());
        dto.setDescription(activity.getDescription());
        dto.setTimestamp(activity.getTimestamp());
        return dto;
    }
}
