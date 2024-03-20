package com.example.busbus_backend.persistence.model;
import java.util.List;
import java.util.Map;

public class Schedule {
    private Timetable forward;
    private Timetable back;

    public Schedule() {
    }

    public Timetable getForward() {
        return forward;
    }

    public void setForward(Timetable forward) {
        this.forward = forward;
    }

    public Timetable getBack() {
        return back;
    }

    public void setBack(Timetable back) {
        this.back = back;
    }

    @Override
    public String toString() {
        return "Schedule{" +
                "outbound=" + forward +
                ", returnSchedule=" + back +
                '}';
    }

    public static class Timetable {
        private Map<String, List<String>> week;
        private Map<String, List<String>> sunday;

        public Timetable() {
        }

        public Map<String, List<String>> getWeek() {
            return week;
        }

        public void setWeek(Map<String, List<String>> week) {
            this.week = week;
        }

        public Map<String, List<String>> getSunday() {
            return sunday;
        }

        public void setSunday(Map<String, List<String>> sunday) {
            this.sunday = sunday;
        }

        @Override
        public String toString() {
            return "Timetable{" +
                    "week=" + week +
                    ", sunday=" + sunday +
                    '}';
        }
    }
}
