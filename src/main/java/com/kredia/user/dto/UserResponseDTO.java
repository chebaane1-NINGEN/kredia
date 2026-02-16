package com.kredia.user.dto;

import com.kredia.common.Role;
import com.kredia.common.UserStatus;
import com.kredia.common.UserStatus;

import java.time.LocalDateTime;

public class UserResponseDTO {
    private Long userId;
    private String email;
    private String phoneNumber;
    private UserStatus status;
    private Role role;
    private String firstName;
    private String lastName;
    private String address;
    private String city;
    private String zipCode;
    private String country;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public UserResponseDTO() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String v) { this.phoneNumber = v; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus v) { this.status = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String v) { this.firstName = v; }
    public String getLastName() { return lastName; }
    public void setLastName(String v) { this.lastName = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getCity() { return city; }
    public void setCity(String v) { this.city = v; }
    public String getZipCode() { return zipCode; }
    public void setZipCode(String v) { this.zipCode = v; }
    public String getCountry() { return country; }
    public void setCountry(String v) { this.country = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime v) { this.lastLogin = v; }

    public static UserResponseDTOBuilder builder() { return new UserResponseDTOBuilder(); }

    public static class UserResponseDTOBuilder {
        private UserResponseDTO dto = new UserResponseDTO();
        public UserResponseDTOBuilder userId(Long v) { dto.setUserId(v); return this; }
        public UserResponseDTOBuilder email(String v) { dto.setEmail(v); return this; }
        public UserResponseDTOBuilder phoneNumber(String v) { dto.setPhoneNumber(v); return this; }
        public UserResponseDTOBuilder status(UserStatus v) { dto.setStatus(v); return this; }
        public UserResponseDTOBuilder role(Role v) { dto.setRole(v); return this; }
        public UserResponseDTOBuilder firstName(String v) { dto.setFirstName(v); return this; }
        public UserResponseDTOBuilder lastName(String v) { dto.setLastName(v); return this; }
        public UserResponseDTOBuilder address(String v) { dto.setAddress(v); return this; }
        public UserResponseDTOBuilder city(String v) { dto.setCity(v); return this; }
        public UserResponseDTOBuilder zipCode(String v) { dto.setZipCode(v); return this; }
        public UserResponseDTOBuilder country(String v) { dto.setCountry(v); return this; }
        public UserResponseDTOBuilder createdAt(LocalDateTime v) { dto.setCreatedAt(v); return this; }
        public UserResponseDTOBuilder lastLogin(LocalDateTime v) { dto.setLastLogin(v); return this; }
        public UserResponseDTO build() { return dto; }
    }
}
