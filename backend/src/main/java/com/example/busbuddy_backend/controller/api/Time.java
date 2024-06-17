package com.example.busbuddy_backend.controller.api;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public class Time {
    /**
     * Returns the current date in the format "dd-MM-yyyy"
     * This method calculates the date on the server side and does not retrieve it from the client.
     *
     * @return the current date in the format "dd-MM-yyyy"
     */
    public static String getCurrentDate() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
    }


    /**
     * Returns the current time in the format "HH:mm"
     * This method calculates the time on the server side and does not retrieve it from the client.
     *
     * @return the current time in the format "HH:mm"
     */
    public static String getCurrentTime() {
        // Calculates the current time and formats it in the "HH:mm" format
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }
}
