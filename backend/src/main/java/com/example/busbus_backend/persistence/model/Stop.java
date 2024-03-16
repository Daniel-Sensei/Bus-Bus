package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.GeoPoint;

import java.util.List;

public class Stop {
    private Long id;
    private String name;
    private String address;
    private GeoPoint coords;
    private List<Bus> nextBuses;

    // Costruttore senza argomenti necessario per la deserializzazione
    public Stop() {
    }

    // Costruttore
    public Stop(Long id, String name, String address, GeoPoint coords, List<Bus> nextBuses) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.coords = coords;
        this.nextBuses = nextBuses;
    }

    // Metodi getter e setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public GeoPoint getCoords() {
        return coords;
    }

    public void setCoords(GeoPoint coords) {
        this.coords = coords;
    }

    public List<Bus> getNextBuses() {
        return nextBuses;
    }

    public void setNextBuses(List<Bus> nextBuses) {
        this.nextBuses = nextBuses;
    }
}

