package com.kredia.dto.user;

import com.kredia.entity.user.Gender;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class ClientProfileUpdateDTO {

    @Size(max = 100, message = "firstName must be at most 100 characters")
    private String firstName;

    @Size(max = 100, message = "lastName must be at most 100 characters")
    private String lastName;

    @Size(max = 20, message = "phoneNumber must be at most 20 characters")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    private String address;

    private Gender gender;

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
}
