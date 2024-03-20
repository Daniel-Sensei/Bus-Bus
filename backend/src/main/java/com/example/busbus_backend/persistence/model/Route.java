package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.DocumentReference;

import java.lang.annotation.Documented;
import java.util.List;

public class Route {
    private String id;
    private String company;
    private String code;
    private StopOutboundReturn stops;
    private Schedule timetable;

    public Route() {
    }

    public Route(String id, String company, String code, StopOutboundReturn stops, Schedule timetable) {
        this.id = id;
        this.company = company;
        this.code = code;
        this.stops = stops;
        this.timetable = timetable;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
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

    public StopOutboundReturn getStops() {
        return stops;
    }

    public void setStops(StopOutboundReturn stops) {
        this.stops = stops;
    }

    public Schedule getTimetable() {
        return timetable;
    }

    public void setTimetable(Schedule timetable) {
        this.timetable = timetable;
    }
}

