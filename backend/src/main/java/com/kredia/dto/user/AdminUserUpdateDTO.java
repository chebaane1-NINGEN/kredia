package com.kredia.dto.user;

import com.kredia.entity.user.Gender;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class AdminUserUpdateDTO {

    @Email(message = "email must be valid")
    private String email;

    @Size(max = 100, message = "firstName must be at most 100 characters")
    private String firstName;

    @Size(max = 100, message = "lastName must be at most 100 characters")
    private String lastName;

    @Size(max = 20, message = "phoneNumber must be at most 20 characters")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    private String address;

    private Gender gender;

    private UserRole role;

    private UserStatus status;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
}
