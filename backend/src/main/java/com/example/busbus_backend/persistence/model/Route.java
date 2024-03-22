package com.example.busbus_backend.persistence.model;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.annotation.DocumentId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class Route {
    @DocumentId
    private String id;
    private String company;
    private String code;
    private ForwardBackStops stops;
    private Schedule timetable;

    @Override
    public String toString() {
        return "Route{" +
                "id='" + id + '\'' +
                ", company='" + company + '\'' +
                ", code='" + code + '\'' +
                ", stops=" + stops +
                ", timetable=" + timetable +
                ", history=" + history +
                '}';
    }

    private Map<String, Data> history;

    public Route() {
    }

    public ForwardBackStops buildStopOutboundReturn(DocumentSnapshot document) throws InterruptedException, ExecutionException {
        List<Stop> outboundStops = buildStopList(document, "stops.forward");
        List<Stop> returnStops = buildStopList(document, "stops.back");

        ForwardBackStops stops = new ForwardBackStops();
        stops.setForwardStops(outboundStops);
        stops.setBackStops(returnStops);
        return stops;
    }

    private List<Stop> buildStopList(DocumentSnapshot document, String fieldPath) throws InterruptedException, ExecutionException {
        List<DocumentReference> stopRefs = (List<DocumentReference>) document.get(fieldPath);
        List<Stop> stops = new ArrayList<>();
        if (stopRefs != null) {
            for (DocumentReference stopRef : stopRefs) {
                Stop stop = stopRef.get().get().toObject(Stop.class);
                stop.setId(stopRef.getId());
                stops.add(stop);
            }
        }
        return stops;
    }

    public Route(String id, String company, String code, ForwardBackStops stops, Schedule timetable, Map<String, Data> history) {
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

    public ForwardBackStops getStops() {
        return stops;
    }

    public void setStops(ForwardBackStops stops) {
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

