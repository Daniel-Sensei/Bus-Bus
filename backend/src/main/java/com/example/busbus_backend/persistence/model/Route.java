package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.DocumentReference;

import java.lang.annotation.Documented;
import java.util.List;
import java.util.Map;

public class Route {
    private String id;
    private String company;
    private String code;
    private StopOutboundReturn stops;
    private Schedule timetable;
    private Map<String, Data> history;

    public Route() {
    }

    public Route(String id, String company, String code, StopOutboundReturn stops, Schedule timetable, Map<String, Data> history) {
        this.id = id;
        this.company = company;
        this.code = code;
        this.stops = stops;
        this.timetable = timetable;
        this.history = history;
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
    public Map<String, Data> getHistory() {
        return history;
    }

    public void setHistory(Map<String, Data> history) {
        this.history = history;
    }

    public static class Data {
        private Schedule.Timetable forward;
        private Schedule.Timetable back;

        public Data() {
        }

        public Schedule.Timetable getForward() {
            return forward;
        }

        public void setForward(Schedule.Timetable forward) {
            this.forward = forward;
        }

        public Schedule.Timetable getBack() {
            return back;
        }

        public void setBack(Schedule.Timetable back) {
            this.back = back;
        }
    }
}

