package com.kredia.user.dto;

public class UserProfileDTO {
    private String firstName;
    private String lastName;
    private String address;
    private String city;
    private String zipCode;
    private String country;

    public UserProfileDTO() {}

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

    public static UserProfileDTOBuilder builder() { return new UserProfileDTOBuilder(); }

    public static class UserProfileDTOBuilder {
        private UserProfileDTO dto = new UserProfileDTO();
        public UserProfileDTOBuilder firstName(String v) { dto.setFirstName(v); return this; }
        public UserProfileDTOBuilder lastName(String v) { dto.setLastName(v); return this; }
        public UserProfileDTOBuilder address(String v) { dto.setAddress(v); return this; }
        public UserProfileDTOBuilder city(String v) { dto.setCity(v); return this; }
        public UserProfileDTOBuilder zipCode(String v) { dto.setZipCode(v); return this; }
        public UserProfileDTOBuilder country(String v) { dto.setCountry(v); return this; }
        public UserProfileDTO build() { return dto; }
    }
}
