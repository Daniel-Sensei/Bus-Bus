package com.example.busbus_backend.persistence.model;

import java.util.List;

public class StopOutboundReturn {
    private List<Stop> forward;
    private List<Stop> back;

    // Costruttore senza argomenti necessario per la deserializzazione
    public StopOutboundReturn() {
    }

    public List<Stop> getForward() {
        return forward;
    }

    public void setForward(List<Stop> forward) {
        this.forward = forward;
    }

    public List<Stop> getBack() {
        return back;
    }

    public void setBack(List<Stop> back) {
        this.back = back;
    }

    @Override
    public String toString() {
        return "StopOutboundReturn{" +
                "outboundStops=" + forward +
                ", returnStops=" + back +
                '}';
    }
}
