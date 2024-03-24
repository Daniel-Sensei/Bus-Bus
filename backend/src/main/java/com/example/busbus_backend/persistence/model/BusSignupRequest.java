package com.example.busbus_backend.persistence.model;

public class BusSignupRequest {
    private String email;
    private String password;
    private String company;

    public BusSignupRequest() {
    }

    public BusSignupRequest(String email, String password, String company) {
        this.email = email;
        this.password = password;
        this.company = company;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    @Override
    public String toString() {
        return "BusSignupRequest{" +
                "email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", company='" + company + '\'' +
                '}';
    }
}
