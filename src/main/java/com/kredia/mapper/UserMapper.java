package com.kredia.mapper;

import com.kredia.dto.UserRequestDTO;
import com.kredia.dto.UserResponseDTO;
import com.kredia.entity.User;
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
        return dto;
    }
}
