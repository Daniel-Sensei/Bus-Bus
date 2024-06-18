package com.example.busbuddy_backend.controller.api;

import com.example.busbuddy_backend.persistence.model.Schedule;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class Utility {

    /**
     * Returns the document snapshot for the document with the given id in the specified collection reference.
     * This method throws an ExecutionException if there is an error retrieving the document.
     * An InterruptedException is thrown if the retrieval is interrupted.
     *
     * @param collectionReference The collection reference to query
     * @param id                  The id of the document to retrieve
     * @return The document snapshot for the specified document
     * @throws InterruptedException If the retrieval is interrupted
     * @throws ExecutionException    If there is an error retrieving the document
     */
    public static DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id)
            throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }


    /**
     * This method checks the integrity of a Schedule object, specifically the delays.
     * It first checks if the Schedule object is null. If it is, it returns false.
     * Then, it iterates over the entries in the forward and back maps of the Schedule object.
     * For each entry, it iterates over the list of times. If any time is null, it returns false.
     * If it has iterated over all entries and all times without finding a null value, it returns true.
     *
     * @param delays The Schedule object to check.
     * @return true if the Schedule object is not null and contains no null times, false otherwise.
     */
    public static boolean checkDelaysIntegrity(Schedule delays) {
        if (delays == null) {
            return false;
        }

        // Check if there are null values in the forward delays
        for (Map.Entry<String, List<String>> entry : delays.getForward().entrySet()) {
            for (String time : entry.getValue()) {
                if (time == null) {
                    return false;
                }
            }
        }

        // Check if there are null values in the back delays
        for (Map.Entry<String, List<String>> entry : delays.getBack().entrySet()) {
            for (String time : entry.getValue()) {
                if (time == null) {
                    return false;
                }
            }
        }

        return true;
    }
}
