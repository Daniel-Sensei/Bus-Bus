package com.example.busbus_backend.persistence.model;

import java.util.List;

public class StopOutboundReturn {
    private List<Stop> forwardStops;
    private List<Stop> backStops;

    // Costruttore senza argomenti necessario per la deserializzazione
    public StopOutboundReturn() {
    }

    public List<Stop> getForwardStops() {
        return forwardStops;
    }

    public void setForwardStops(List<Stop> forwardStops) {
        this.forwardStops = forwardStops;
    }

    public List<Stop> getBackStops() {
        return backStops;
    }

    public void setBackStops(List<Stop> backStops) {
        this.backStops = backStops;
    }

    @Override
    public String toString() {
        return "StopOutboundReturn{" +
                "outboundStops=" + forwardStops +
                ", returnStops=" + backStops +
                '}';
    }
}
