package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.DocumentReference;

import java.lang.annotation.Documented;
import java.util.List;

public class Route {
    private Long id;
    private String company;
    private String code;
    private List<Stop> stops;
    private List<String[]> hours;

    // Costruttore senza argomenti necessario per la deserializzazione
    public Route() {
    }

    // Costruttore
    public Route(Long id, String company, String code, List<Stop> stops, List<String[]> hours) {
        this.id = id;
        this.company = company;
        this.code = code;
        this.stops = stops;
        this.hours = hours;
    }

    // Metodi getter e setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<Stop> getStops() {
        return stops;
    }

    public void setStops(List<Stop> stops) {
        this.stops = stops;
    }

    public List<String[]> getHours() {
        return hours;
    }

    public void setHours(List<String[]> hours) {
        this.hours = hours;
    }
}

