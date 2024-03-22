package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.annotation.DocumentId;

public class Bus {
    @DocumentId
    private String id;
    private Route route;
    private GeoPoint coords;
    private double speed;
    // private List<Stop> nextStops; // Se desideri gestire anche la lista di prossime fermate

    private int lastStop;

    // Costruttore senza argomenti necessario per la deserializzazione
    public Bus() {
    }

    // Costruttore
    public Bus(String id, Route route, GeoPoint coords, double speed, int lastStop) {
        this.id = id;
        this.route = route;
        this.coords = coords;
        this.speed = speed;
        this.lastStop = lastStop;
    }

    // Metodi getter e setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Route getRoute() {
        return route;
    }

    public void setRoute(Route route) {
        this.route = route;
    }

    public GeoPoint getCoords() {
        return coords;
    }

    public void setCoords(GeoPoint coords) {
        this.coords = coords;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    /*
    public List<Stop> getNextStops() {
        return nextStops;
    }

    public void setNextStops(List<Stop> nextStops) {
        this.nextStops = nextStops;
    }
    */

    public int getLastStop() {
        return lastStop;
    }

    public void setLastStop(int lastStop) {
        this.lastStop = lastStop;
    }
}

