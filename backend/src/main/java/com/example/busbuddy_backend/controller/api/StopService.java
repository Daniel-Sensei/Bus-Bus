package com.example.busbuddy_backend.controller.api;

import com.example.busbuddy_backend.persistence.model.Route;
import com.example.busbuddy_backend.persistence.model.Schedule;
import com.example.busbuddy_backend.persistence.model.Stop;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static com.example.busbuddy_backend.controller.api.Time.getCurrentDate;
import static java.awt.geom.Point2D.distance;

@RestController
@CrossOrigin("*")
public class StopService {
    private final String STOPS_COLLECTION = "stops";
    private final String ROUTES_COLLECTION = "routes";

    /**
     * Get a stop by its ID.
     *
     * @param id The ID of the stop.
     * @return The stop object wrapped in a ResponseEntity.
     * @throws InterruptedException if the retrieval of the document is interrupted.
     * @throws ExecutionException if there is an error retrieving the document.
     */
    @GetMapping("/stop")
    public ResponseEntity<Stop> getStop(@RequestParam String id) {
        // Get the Firestore instance and the "stops" collection reference
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            // Get the document by its ID
            DocumentSnapshot document = getDocumentById(stops, id);
            if (document.exists()) {
                // Convert the document to a Stop object
                Stop stop = document.toObject(Stop.class);

                // Return the stop with a success response
                return new ResponseEntity<>(stop, HttpStatus.OK);
            } else {
                // If the stop is not found, return a not found response
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            // If there is an error, throw a runtime exception
            throw new RuntimeException(e);
        }
    }

    /**
     * Retrieves all stops within a given radius from a specific latitude and longitude.
     * The stops are ordered by distance from the specified coordinates.
     *
     * @param latitude The latitude of the center point.
     * @param longitude The longitude of the center point.
     * @param radius The radius within which to search for stops (in meters).
     * @return A list of stops within the specified radius, ordered by distance from the specified coordinates.
     * @throws InterruptedException if the retrieval of the documents is interrupted.
     * @throws ExecutionException if there is an error retrieving the documents.
     */
    @GetMapping("/stopsWithinRadius")
    public ResponseEntity<List<Stop>> getStopsWithinRadius(
            @RequestParam double latitude, @RequestParam double longitude, @RequestParam double radius) {
        // Get the Firestore instance and the "stops" collection reference
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            // Get all stops and filter out those outside the specified radius
            List<Stop> allStops = stops.get().get().toObjects(Stop.class);
            List<Stop> inRadiusStops = new ArrayList<>();
            for (Stop stop : allStops) {
                if (isWithinRadius(latitude, longitude, radius, stop)) {
                    inRadiusStops.add(stop);
                }
            }

            // Order stops by distance from the specified coordinates
            inRadiusStops.sort((s1, s2) -> {
                double d1 = distance(latitude, longitude, s1.getCoords().getLatitude(), s1.getCoords().getLongitude());
                double d2 = distance(latitude, longitude, s2.getCoords().getLatitude(), s2.getCoords().getLongitude());
                return Double.compare(d1, d2);
            });

            // Return the list of stops with a success response
            return new ResponseEntity<>(inRadiusStops, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            // If there is an error, throw a runtime exception
            throw new RuntimeException(e);
        }
    }

    /**
     * Checks if a given stop is within a specified radius of a given set of coordinates.
     *
     * @param latitude The latitude of the center point.
     * @param longitude The longitude of the center point.
     * @param radius The radius within which to search for stops (in meters).
     * @param stop The stop to check.
     * @return True if the stop is within the specified radius, false otherwise.
     */
    private boolean isWithinRadius(double latitude, double longitude, double radius, Stop stop) {
        // Convert coordinates to radians
        double lat1 = Math.toRadians(latitude);  // latitude of the center point
        double lon1 = Math.toRadians(longitude); // longitude of the center point
        double lat2 = Math.toRadians(stop.getCoords().getLatitude());  // latitude of the stop
        double lon2 = Math.toRadians(stop.getCoords().getLongitude());  // longitude of the stop

        // Calculate the difference between the coordinates
        double dLat = lat2 - lat1;  // difference in latitude
        double dLon = lon2 - lon1;  // difference in longitude

        // Haversine formula to calculate the distance
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = 6371000 * c; // Mean radius of Earth in meters

        // Check if the distance is within the specified radius
        return distance <= radius;
    }

    /**
     * Get the next buses for a given stop within a specified radius.
     *
     * @param stopId The ID of the stop.
     * @return A response entity containing a map of route codes to lists of next bus times, or a not found response if the stop does not exist.
     */
    @GetMapping("/nextBuses")
    public ResponseEntity<Map<String, List<String>>> getNextBusesByStop(@RequestParam String stopId) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            //salva la reference del documento del tipo DocumentReference
            DocumentSnapshot document = getDocumentById(stops, stopId);
            if (document.exists()) {
                DocumentReference stopRef = document.getReference();
                List<DocumentReference> routesRefs = (List<DocumentReference>) document.get("routes");
                System.out.println(routesRefs);
                System.out.println("numero di route: " + routesRefs.size());


                //crea una mappa vuota
                Map<String, List<String>> nextBuses = new HashMap<>();
                List<DocumentReference> stopsReferenceForward = null;
                List<DocumentReference> stopsReferenceBack = null;
                for( DocumentReference routeRef : routesRefs) {
                    DocumentSnapshot routeDocument = routeRef.get().get();
                    Route route = routeDocument.toObject(Route.class);
                    System.out.println(route.getCode());
                    //FORWARD
                    stopsReferenceForward = (List<DocumentReference>) routeDocument.get("stops.forward");
                    Integer indexForward = null;
                    if(stopsReferenceForward.contains(stopRef)) {
                        indexForward = stopsReferenceForward.indexOf(stopRef);
                    }
                    //BACK
                    stopsReferenceBack = (List<DocumentReference>) routeDocument.get("stops.back");
                    Integer indexBack = null;
                    if(stopsReferenceBack.contains(stopRef)) {
                        indexBack = stopsReferenceBack.indexOf(stopRef);
                    }


                    //controlla in nella mappa route.history con chiave "giorantaOdierna" nel formato "dd-MM-yyyy"
                    //successivamnete muoviti in sunday se il giorno della settimana è domenica altrimenti in week
                    //se la mappa non è vuota allora prendi la lista di orari di forward con chiave indexForward
                    // prendi anche la lista di orari di back con chiave indexBack
                    Map<String, Schedule> history = route.getHistory();
                    if (history != null) {
                        // Ottenere l'oggetto Data per la data odierna
                        String today = getCurrentDate();
                        Schedule todayData = history.get(today);

                        Schedule schedule = route.getDelays();
                        if(!checkDelaysIntegrity(schedule)) {
                            System.out.println("Delays are NOT ok");
                            schedule = route.getTimetable();
                        }

                        if (todayData != null) {
                            // Ottenere la lista di orari per la fermata
                            List<String> forwardDay = todayData.getForward().get(String.valueOf(indexForward));
                            List<String> backDay = todayData.getBack().get(String.valueOf(indexBack));

                            int startIndexForward = 0;
                            for(String time : forwardDay) {
                                if(time == null || !time.equals("-")) {
                                    startIndexForward += 1;
                                }
                            }

                            int startIndexBack = 0;
                            if(backDay != null) {
                                for (String time : backDay) {
                                    if (time == null || !time.equals("-")) {
                                        startIndexBack += 1;
                                    }
                                }
                            }

                            //schedule = route.getTimetable();

                            List<String> forward =schedule.getForward().get(String.valueOf(indexForward));
                            List<String> back =schedule.getBack().get(String.valueOf(indexBack));

                            if(backDay != null) {
                                String destination = route.getCode().split("_")[1];
                                //ordina al contrario la destinazione splittando per "-"
                                //esempio: "A-B" diventa "B-A"
                                //la destinazione potrebbe avere più di un "-"
                                //quindi prendi la''ray splittato e ordina al contrario tutto
                                String[] destinationArray = destination.split(" - ");
                                String invertedDestination = "";
                                for (int i = destinationArray.length - 1; i >= 0; i--) {
                                    invertedDestination += destinationArray[i] + " - ";
                                }
                                invertedDestination = invertedDestination.substring(0, invertedDestination.length() - 3);

                                nextBuses.put(route.getCode().split("_")[0] + "_" + destination, forward.subList(startIndexForward, forward.size()));
                                nextBuses.put(route.getCode().split("_")[0] + "_" + invertedDestination, back.subList(startIndexBack, back.size()));
                            } else {
                                nextBuses.put(route.getCode(), forward.subList(startIndexForward, forward.size()));
                            }

                        }
                        else{
                            //se la giornata attuale nella history è vuota allora prendi tutti gli orari di forward e back
                            //dalla timetable senza considerare gli indici

                            //schedule = route.getTimetable();

                            List<String> forward =schedule.getForward().get(String.valueOf(indexForward));
                            List<String> back =schedule.getBack().get(String.valueOf(indexBack));

                            //riempie la mappa nextBuses con gli orari di forward e back
                            //inverti la destinazione se la lista di back non è vuota

                            if(back != null) {
                                String destination = route.getCode().split("_")[1];
                                String[] destinationArray = destination.split(" - ");
                                String invertedDestination = "";
                                for (int i = destinationArray.length - 1; i >= 0; i--) {
                                    invertedDestination += destinationArray[i] + " - ";
                                }
                                invertedDestination = invertedDestination.substring(0, invertedDestination.length() - 3);

                                nextBuses.put(route.getCode().split("_")[0] + "_" + destination, forward);
                                nextBuses.put(route.getCode().split("_")[0] + "_" + invertedDestination, back);
                            } else {
                                nextBuses.put(route.getCode(), forward);
                            }

                        }
                    }


                }

                return new ResponseEntity<>(nextBuses, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Add the next bus times to the map.
     *
     * @param nextBuses The map to add the next bus times to.
     * @param route The route object.
     * @param forward The list of forward bus times.
     * @param back The list of backward bus times.
     * @param startIndexForward The start index for the forward times.
     * @param startIndexBack The start index for the backward times.
     */
    private void addNextBusTimes(Map<String, List<String>> nextBuses, Route route, List<String> forward, List<String> back, int startIndexForward, int startIndexBack) {
        if (back != null) {
            String destination = route.getCode().split("_")[1];
            String[] destinationArray = destination.split(" - ");
            String invertedDestination = "";
            for (int i = destinationArray.length - 1; i >= 0; i--) {
                invertedDestination += destinationArray[i] + " - ";
            }
            invertedDestination = invertedDestination.substring(0, invertedDestination.length() - 3);

            nextBuses.put(route.getCode().split("_")[0] + "_" + destination, forward.subList(startIndexForward, forward.size()));
            nextBuses.put(route.getCode().split("_")[0] + "_" + invertedDestination, back.subList(startIndexBack, back.size()));
        } else {
            nextBuses.put(route.getCode(), forward.subList(startIndexForward, forward.size()));
        }
    }

    private boolean checkDelaysIntegrity(Schedule delays) {
        //check if there are null values in the delays
        for (Map.Entry<String, List<String>> entry : delays.getForward().entrySet()) {
            for (String time : entry.getValue()) {
                if (time == null) {
                    return false;
                }
            }
        }

        for (Map.Entry<String, List<String>> entry : delays.getBack().entrySet()) {
            for (String time : entry.getValue()) {
                if (time == null) {
                    return false;
                }
            }
        }

        return true;
    }

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
    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }
}
