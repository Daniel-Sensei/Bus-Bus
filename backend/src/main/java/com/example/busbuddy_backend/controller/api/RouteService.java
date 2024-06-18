package com.example.busbuddy_backend.controller.api;

import com.example.busbuddy_backend.persistence.model.Route;
import com.example.busbuddy_backend.persistence.model.ForwardBackStops;
import com.example.busbuddy_backend.persistence.model.Schedule;
import com.example.busbuddy_backend.persistence.model.Stop;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;

import static com.example.busbuddy_backend.controller.api.Utility.getDocumentById;

@RestController
@CrossOrigin("*")
public class RouteService {

    private final String ROUTES_COLLECTION = "routes";
    private final String STOPS_COLLECTION = "stops";

    /**
     * Retrieves a route from Firestore by its ID.
     * 
     * @param id The ID of the route to retrieve.
     * @return The route object if found, otherwise a not found response.
     */
    @GetMapping("/route")
    public ResponseEntity<Route> getRoute(@RequestParam String id) {
        // Get the Firestore instance
        Firestore db = FirestoreClient.getFirestore();
        // Get the "routes" collection reference
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the document by its ID
            DocumentSnapshot document = getDocumentById(routes, id);
            if (document.exists()) {
                // Convert the document to a Route object
                Route route = document.toObject(Route.class);

                // Build the forward and backward stops
                ForwardBackStops stops = route.buildStopOutboundReturn(document);
                // Set the stops in the route
                route.setStops(stops);

                // Return the route object
                return new ResponseEntity<>(route, HttpStatus.OK);
            } else {
                // Return a not found response if the document does not exist
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            // Throw a runtime exception if an error occurs
            throw new RuntimeException(e);
        }
    }

    /**
     * Retrieves all routes from Firestore, grouping them by "company".
     * 
     * @return A map containing the grouped routes, where the key is the company name and the value is a list of routes.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while retrieving the routes.
     */
    @GetMapping("/allRoutes")
    public ResponseEntity<Map<String, List<Route>>> getAllRoutes() throws InterruptedException, ExecutionException {
        // Get the Firestore instance
        Firestore db = FirestoreClient.getFirestore();
        // Get the "routes" collection reference
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        // Retrieve all routes from Firestore
        List<Route> allRoutes = routes.get().get().toObjects(Route.class);

        // Build the forward and backward stops for each route
        for (Route route : allRoutes) {
            DocumentSnapshot document = getDocumentById(routes, route.getId());
            ForwardBackStops stops = route.buildStopOutboundReturn(document);
            route.setStops(stops);
        }

        // Create a map to group the routes by "company"
        Map<String, List<Route>> groupedRoutes = new HashMap<>();

        // Group the routes by "company"
        for (Route route : allRoutes) {
            String company = route.getCompany();
            if (company != null) {
                // If the company key does not exist, add a new entry with a new ArrayList
                groupedRoutes.putIfAbsent(company, new ArrayList<>());
                // Add the route to the existing list
                groupedRoutes.get(company).add(route);
            }
        }

        // Return the grouped routes as a response
        return new ResponseEntity<>(groupedRoutes, HttpStatus.OK);
    }

    /**
     * Adds a route with its stops to the Firestore database.
     * Checks if a route with the same code and company already exists.
     * If it does, returns a conflict status.
     * If it doesn't, adds the route and its stops to the database.
     *
     * @param route The Route object to be added.
     * @return A ResponseEntity containing a boolean indicating if the operation was successful.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while retrieving the routes.
     */
    @PostMapping("/addRouteAndStops")
    public ResponseEntity<Boolean> addRoute(@RequestBody Route route) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            // Check if a route with the same code and company already exists
            List<QueryDocumentSnapshot> routeList = routes.whereEqualTo("code", route.getCode())
                    .whereEqualTo("company", route.getCompany()).get().get().getDocuments();
            if (!routeList.isEmpty()) {
                return new ResponseEntity<>(false, HttpStatus.CONFLICT);
            }

            List<DocumentReference> stopsForwardRefsToAddInRoute = new ArrayList<>();
            List<DocumentReference> stopsBackRefsToAddInRoute = new ArrayList<>();

            // Add the forward stops to the database and get their references
            List<Stop> forwardStops = route.getStops().getForwardStops();
            for (Stop stop : forwardStops) {
                List<QueryDocumentSnapshot> stopList = stops.whereEqualTo("address", stop.getAddress())
                        .get().get().getDocuments();
                if (stopList.isEmpty()) {
                    // Add the stop to the database and get its reference
                    DocumentReference stopRef = stops.add(stop).get();
                    stopsForwardRefsToAddInRoute.add(stopRef);
                } else {
                    stopsForwardRefsToAddInRoute.add(stopList.get(0).getReference());
                }
            }

            // Add the backward stops to the database and get their references
            List<Stop> backStops = route.getStops().getBackStops();
            for (Stop stop : backStops) {
                List<QueryDocumentSnapshot> stopList = stops.whereEqualTo("address", stop.getAddress())
                        .get().get().getDocuments();
                if (stopList.isEmpty()) {
                    // Add the stop to the database and get its reference
                    DocumentReference stopRef = stops.add(stop).get();
                    stopsBackRefsToAddInRoute.add(stopRef);
                } else {
                    stopsBackRefsToAddInRoute.add(stopList.get(0).getReference());
                }
            }

            // Add the route to the database without the stop references
            route.setStops(null);
            DocumentReference routeRef = routes.add(route).get();
            // Add the stop references to the "stops" field of the route document
            routeRef.update("stops.forward", stopsForwardRefsToAddInRoute);
            routeRef.update("stops.back", stopsBackRefsToAddInRoute);

            // Add the reference of the route document to the "routes" field of each stop document
            // Both for the newly added stops and the already existing ones
            for (DocumentReference stopRef : stopsForwardRefsToAddInRoute) {
                stopRef.update("routes", FieldValue.arrayUnion(routeRef));
            }
            for (DocumentReference stopRef : stopsBackRefsToAddInRoute) {
                stopRef.update("routes", FieldValue.arrayUnion(routeRef));
            }

        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    /**
     * Deletes a route from the Firestore database.
     * Also removes the route reference from each stop's "routes" field.
     *
     * @param id The ID of the route to delete.
     * @return A ResponseEntity indicating if the operation was successful.
     *         If the route with the given ID does not exist, returns a NOT_FOUND status.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while retrieving the routes or stops.
     */
    @DeleteMapping("/deleteRoute")
    public ResponseEntity<Boolean> deleteRoute(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(routes, id);
            if (document.exists()) {
                // Get the references to the stops of the route
                Set<DocumentReference> stopsRefs = new HashSet<>();
                List<DocumentReference> stopsForwardRefs = (List<DocumentReference>) document.get("stops.forward");
                List<DocumentReference> stopsBackRefs = (List<DocumentReference>) document.get("stops.back");
                stopsRefs.addAll(stopsForwardRefs);
                stopsRefs.addAll(stopsBackRefs);

                // Remove the route reference from each stop's "routes" field
                for (DocumentReference stopRef : stopsRefs) {
                    stopRef.update("routes", FieldValue.arrayRemove(document.getReference()));
                }

                // Delete the route document from the database
                document.getReference().delete();
            } else {
                return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    /**
     * Updates the delays of a route with the given ID.
     *
     * @param routeId The ID of the route to update.
     * @return A ResponseEntity indicating if the operation was successful.
     *         If the route with the given ID does not exist, returns a NOT_FOUND status.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while retrieving the routes or stops.
     */
    @GetMapping("/updateDelays")
    public ResponseEntity<Boolean> updateDelay(@RequestParam String routeId) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the route document by ID
            DocumentSnapshot document = getDocumentById(routes, routeId);
            if (document.exists()) {
                // Convert the document to a Route object
                Route route = document.toObject(Route.class);

                // Get the history of the route
                Map<String, Schedule> history = route.getHistory();

                // If the history exists and is not empty, update the delays
                if (history != null && !history.isEmpty()) {
                    Iterator<Map.Entry<String, Schedule>> iterator = history.entrySet().iterator();
                    Schedule delays = iterator.next().getValue(); // Initialize delays with the first entry

                    // Update the delays for each schedule in the history
                    while (iterator.hasNext()) {
                        Map.Entry<String, Schedule> entry = iterator.next();
                        Schedule schedule = entry.getValue();
                        updateDelayTimes(delays.getForward(), schedule.getForward());
                        updateDelayTimes(delays.getBack(), schedule.getBack());
                    }

                    // Update the delays in the route document
                    document.getReference().update("delays", delays);
                } else {
                    return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
                }
            } else {
                return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    /**
     * Updates the delay times in the given delaysTimes map based on the times in the times map.
     *
     * @param delaysTimes a map of stop names to lists of delay times
     * @param times a map of stop names to lists of times
     */
    private void updateDelayTimes(Map<String, List<String>> delaysTimes, Map<String, List<String>> times) {
        // Iterate over each entry in the times map
        for (Map.Entry<String, List<String>> entry : times.entrySet()) {
            String stop = entry.getKey(); // Get the stop name
            List<String> stopTimes = entry.getValue(); // Get the list of times for the stop
            List<String> stopDelaysTimes = delaysTimes.get(stop); // Get the list of delay times for the stop

            // Iterate over each time in the stop times list
            for (int i = 0; i < stopTimes.size(); i++) {
                String time = stopTimes.get(i); // Get the time

                // If the time is not null, update the delay time
                if (time != null) {
                    String delayTime = stopDelaysTimes.get(i); // Get the delay time
                    stopDelaysTimes.set(i, delayTime != null ? averageTime(delayTime, time) : time); // Update the delay time
                }
            }
        }
    }

    /**
     * Calculates the average time between two given times.
     *
     * @param time1 the first time in the format "HH:MM"
     * @param time2 the second time in the format "HH:MM"
     * @return the average time in the format "HH:MM"
     */
    private String averageTime(String time1, String time2) {
        // Split the times into hours and minutes
        String[] time1Split = time1.split(":");
        String[] time2Split = time2.split(":");

        // Convert the hours and minutes to integers
        int hour1 = Integer.parseInt(time1Split[0]);
        int minute1 = Integer.parseInt(time1Split[1]);
        int hour2 = Integer.parseInt(time2Split[0]);
        int minute2 = Integer.parseInt(time2Split[1]);

        // Calculate the total minutes for each time
        int totalMinutes1 = hour1 * 60 + minute1;
        int totalMinutes2 = hour2 * 60 + minute2;

        // Calculate the average total minutes
        int averageTotalMinutes = (totalMinutes1 + totalMinutes2) / 2;

        // Calculate the average hour and minute
        int averageHour = averageTotalMinutes / 60;
        int averageMinute = averageTotalMinutes % 60;

        // Format the average time as "HH:MM"
        return averageHour + ":" + averageMinute;
    }

    /**
     * Updates the delays for all routes in the database.
     *
     * This function calls the replaceDashInHistory() function to replace "-" with null in the
     * history of each route, and then updates the delays for each route using the updateDelayTimes()
     * function.
     *
     * @return A ResponseEntity containing a boolean indicating if the operation was successful and
     *         an HTTP status code.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while getting the routes or updating the
     *                              delays.
     */
    @GetMapping("/updateAllDelays")
    public ResponseEntity<Boolean> updateAllDelays() throws InterruptedException, ExecutionException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        // Replace "-" with null in the history of each route
        replaceDashInHistory();

        try {
            // Get all routes
            ApiFuture<QuerySnapshot> future = routes.get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            for (QueryDocumentSnapshot document : documents) {
                Route route = document.toObject(Route.class);
                Map<String, Schedule> history = route.getHistory();

                if (history != null && !history.isEmpty()) {
                    Iterator<Map.Entry<String, Schedule>> iterator = history.entrySet().iterator();
                    Schedule delays = iterator.next().getValue(); // Initialize delays with the first entry

                    while (iterator.hasNext()) {
                        Map.Entry<String, Schedule> entry = iterator.next();
                        Schedule schedule = entry.getValue();
                        updateDelayTimes(delays.getForward(), schedule.getForward());
                        updateDelayTimes(delays.getBack(), schedule.getBack());
                    }

                    // Update the delays in the route document
                    document.getReference().update("delays", delays);
                }
            }

            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Replaces all occurrences of "-" with null in the history of all routes in the database.
     *
     * @return A ResponseEntity containing a boolean indicating if the operation was successful and
     *         an HTTP status code.
     * @throws InterruptedException If the operation is interrupted.
     * @throws ExecutionException   If an exception occurs while getting the routes or updating the
     *                              history.
     */
    private ResponseEntity<Boolean> replaceDashInHistory() {
        // Get the Firestore database instance
        Firestore db = FirestoreClient.getFirestore();

        // Get the collection of routes
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get all routes
            ApiFuture<QuerySnapshot> future = routes.get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            // Iterate over each route document
            for (QueryDocumentSnapshot document : documents) {
                Route route = document.toObject(Route.class);
                Map<String, Schedule> history = route.getHistory();

                // If the route has a history and it's not empty
                if (history != null && !history.isEmpty()) {
                    // Iterate over each schedule in the history
                    for (Map.Entry<String, Schedule> entry : history.entrySet()) {
                        Schedule schedule = entry.getValue();

                        // Replace "-" with null in the forward and back times of the schedule
                        replaceDashWithNull(schedule.getForward());
                        replaceDashWithNull(schedule.getBack());
                    }

                    // Update the history in the route document
                    document.getReference().update("history", history);
                }
            }

            // Return a successful response
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            // If an exception occurs, return an unsuccessful response with an internal server error status code
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Replaces all occurrences of "-" with null in the given map of stop names to lists of times.
     *
     * @param times A map of stop names to lists of times.
     */
    private void replaceDashWithNull(Map<String, List<String>> times) {
        // Iterate over each list of times in the map
        for (List<String> stopTimes : times.values()) {
            // Iterate over each time in the list
            for (int i = 0; i < stopTimes.size(); i++) {
                // If the time is "-", replace it with null
                if ("-".equals(stopTimes.get(i))) {
                    stopTimes.set(i, null);
                }
            }
        }
    }
}
