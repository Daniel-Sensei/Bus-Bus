package com.example.busbuddy_backend.controller.api;

import com.example.busbuddy_backend.persistence.model.*;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.springframework.web.bind.annotation.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

import static com.example.busbuddy_backend.controller.api.Time.getCurrentDate;
import static com.example.busbuddy_backend.controller.api.Time.getCurrentTime;
import static com.example.busbuddy_backend.controller.api.Utility.checkDelaysIntegrity;
import static com.example.busbuddy_backend.controller.api.Utility.getDocumentById;

@RestController
@CrossOrigin("*")
public class BusService {
    private final String BUSES_COLLECTION = "buses";
    private final String ROUTES_COLLECTION = "routes";
    private final String COMPANIES_COLLECTION = "companies";

    /**
     * Get a bus by its ID.
     *
     * @param id The ID of the bus.
     * @return The bus object if found, otherwise a not found response.
     */
    @GetMapping("/bus")
    public ResponseEntity<Bus> getBus(@RequestParam String id) {
        // Get the Firestore instance
        Firestore db = FirestoreClient.getFirestore();
        // Get the "buses" collection reference
        CollectionReference buses = db.collection(BUSES_COLLECTION);

        try {
            // Get the document by its ID
            DocumentSnapshot document = getDocumentById(buses, id);
            if (document.exists()) {
                // Get the route reference from the document
                DocumentReference routeRef = (DocumentReference) document.get("route");
                // Get the route document
                DocumentSnapshot routeDocument = routeRef.get().get();
                // Convert the route document to a Route object
                Route route = routeDocument.toObject(Route.class);
                // Build the forward and backward stops
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);
                // Set the stops in the route
                route.setStops(stops);

                // Create a new Bus object and set its fields individually
                Bus bus = new Bus();
                bus.setId(document.getId());
                bus.setCode(document.getString("code"));
                bus.setRoute(route);

                return new ResponseEntity<>(bus, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Endpoint for company signup.
     *
     * @param requestBody The request body containing the email, password and
     *                    company.
     * @return A response entity with a success message and the ID of the registered
     *         company, or an error message if the request is invalid.
     */
    @PostMapping("/signupCompany")
    public ResponseEntity<String> signupCompany(@RequestBody BusSignupRequest requestBody) {
        // Get the email, password and company from the request body
        String email = requestBody.getEmail();
        String password = requestBody.getPassword();
        String company = requestBody.getCompany();

        // Check if the required fields are present
        if (company == null || company.isEmpty() || email == null || email.isEmpty() || password == null
                || password.isEmpty()) {
            // If any of the required fields are missing, return a bad request response with
            // an error message
            return new ResponseEntity<>("I campi email, password e company sono obbligatori", HttpStatus.BAD_REQUEST);
        }

        // Create a CreateRequest object with the email and password
        CreateRequest request = new CreateRequest()
                .setEmail(email)
                .setPassword(password)
                .setDisabled(false);

        UserRecord companyRecord;
        try {
            // Create a new user using Firebase Authentication
            companyRecord = FirebaseAuth.getInstance().createUser(request);

            // Save additional details of the bus company in your database if needed.
            // The companies are saved in the "companies" collection in Firestore.
            Firestore db = FirestoreClient.getFirestore();
            CollectionReference companies = db.collection(COMPANIES_COLLECTION);

            // Create a map with the company name and email
            Map<String, Object> data = new HashMap<>();
            data.put("name", company);
            data.put("email", email);

            // Save the company details in Firestore
            db.collection(COMPANIES_COLLECTION).document(companyRecord.getUid()).set(data);
        } catch (Exception e) {
            // If there is an error during registration, return a bad request response with
            // the error message
            return new ResponseEntity<>("Errore durante la registrazione dell'azienda: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }

        // Return a success response with the ID of the registered company
        return new ResponseEntity<>("Azienda registrata con successo con ID: " + companyRecord.getUid(), HttpStatus.OK);

    }

    /**
     * Get a bus by its code.
     *
     * @param code The code of the bus.
     * @return The bus object if found, otherwise a not found response.
     */
    @GetMapping("/busByCode")
    public ResponseEntity<Bus> getBusByCode(@RequestParam String code) {
        try {
            // Get the Firestore instance and the "buses" collection reference
            Firestore db = FirestoreClient.getFirestore();
            CollectionReference buses = db.collection(BUSES_COLLECTION);

            // Query the "buses" collection for the bus with the given code
            Query query = buses.whereEqualTo("code", code);
            QuerySnapshot querySnapshot = query.get().get();

            // If no bus is found, return a not found response
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Get the first document matching the query
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);

            // Get the reference to the route document from the bus document
            DocumentReference routeRef = (DocumentReference) document.get("route");

            // Get the route document
            DocumentSnapshot routeDocument = routeRef.get().get();

            // Convert the route document to a Route object
            Route route = routeDocument.toObject(Route.class);

            // Build the forward and backward stops for the route
            ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);

            // Set the stops in the route
            route.setStops(stops);

            // Set the timetable and history fields to null
            route.setTimetable(null);
            route.setHistory(null);

            // Create a new Bus object and set its fields individually
            Bus bus = new Bus();
            bus.setId(document.getId());
            bus.setRoute(route);
            bus.setCode(code);

            // Create a GeoPoint object with default coordinates
            GeoPoint coords = new GeoPoint(0, 0);
            bus.setCoords(coords);

            // Return the bus object with a success response
            return new ResponseEntity<>(bus, HttpStatus.OK);
        } catch (Exception e) {
            // If there is an error, return an unauthorized response
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    /**
     * Retrieves the forward and backward stops for a bus specified by its ID.
     *
     * @param busId The ID of the bus.
     * @return The forward and backward stops of the bus, wrapped in a ResponseEntity.
     * @throws InterruptedException if the retrieval of the document is interrupted.
     * @throws ExecutionException if there is an error retrieving the document.
     */
    @GetMapping("/stopsByBus")
    public ResponseEntity<ForwardBackStops> getStopsByBus(@RequestParam String busId)
            throws InterruptedException, ExecutionException {
        // Get the Firestore instance and the "buses" collection reference
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);

        try {
            // Get the document by its ID
            DocumentSnapshot document = getDocumentById(buses, busId);
            if (document.exists()) {
                // Get the reference to the route document from the bus document
                DocumentReference routeRef = (DocumentReference) document.get("route");
                // Get the route document
                DocumentSnapshot routeDocument = routeRef.get().get();
                // Convert the route document to a Route object
                Route route = routeDocument.toObject(Route.class);
                // Build the forward and backward stops for the route
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);

                // Return the forward and backward stops with a success response
                return new ResponseEntity<>(stops, HttpStatus.OK);
            } else {
                // If the bus is not found, return a not found response
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            // If there is an error, throw a runtime exception
            throw new RuntimeException(e);
        }
    }

    /**
     * Retrieves the next arrival times for each stop for a bus specified by its ID and direction.
     *
     * @param busId The ID of the bus.
     * @param direction The direction of the bus: "forward" or "back".
     * @return A map containing the stop IDs as keys and the next arrival times as values.
     * @throws InterruptedException if the retrieval of the document is interrupted.
     * @throws ExecutionException if there is an error retrieving the document.
     */
    @GetMapping("/next-arrivals-by-bus-direction")
    public ResponseEntity<Map<String, List<String>>> getNextArrivalsByBus(@RequestParam String busId,
            @RequestParam String direction)
            throws InterruptedException, ExecutionException {
        // Get the Firestore instance and the "buses" collection reference
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);

        try {
            // Get the document by its ID
            DocumentSnapshot document = getDocumentById(buses, busId);
            if (document.exists()) {
                // Get the reference to the route document from the bus document
                DocumentReference routeRef = (DocumentReference) document.get("route");
                // Get the route document
                DocumentSnapshot routeDocument = routeRef.get().get();
                // Convert the route document to a Route object
                Route route = routeDocument.toObject(Route.class);
                // Get the forward and backward stops of the route
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);

                Map<String, List<String>> nextArrivals = new HashMap<>();

                // Get the history and delays of the route
                Map<String, Schedule> history = route.getHistory();
                if (history != null) {
                    String today = getCurrentDate();
                    Schedule todayData = history.get(today);

                    Schedule schedule = route.getDelays();
                    // If the delays are not valid, use the timetable instead
                    if (!checkDelaysIntegrity(schedule)) {
                        schedule = route.getTimetable();
                    }

                    // Get the timetable for the specified direction
                    Map<String, List<String>> timetable = direction.equals("forward") ? schedule.getForward()
                            : schedule.getBack();

                    // If there is history data for today, use it to find the next arrival times
                    if (todayData != null) {
                        for (Map.Entry<String, List<String>> entry : timetable.entrySet()) {
                            List<String> entryHistory = direction.equals("forward")
                                    ? todayData.getForward().get(entry.getKey())
                                    : todayData.getBack().get(entry.getKey());

                            // Find the index of the first non-null or non-"-" time in the entry history
                            int startIndex = 0;
                            for (String time : entryHistory) {
                                if (time == null || !time.equals("-")) {
                                    startIndex += 1;
                                }
                            }

                            List<String> times = entry.getValue();
                            // Get the stop ID based on the entry key and the direction
                            String stopId = direction.equals("forward")
                                    ? stops.getForwardStops().get(Integer.parseInt(entry.getKey())).getId()
                                    : stops.getBackStops().get(Integer.parseInt(entry.getKey())).getId();

                            // Add the next arrival times to the map
                            nextArrivals.put(stopId, times.subList(startIndex, times.size()));
                        }
                    } else {
                        // If there is no history data for today, use the timetable directly
                        for (Map.Entry<String, List<String>> entry : timetable.entrySet()) {
                            List<String> times = entry.getValue();
                            String stopId = direction.equals("forward")
                                    ? stops.getForwardStops().get(Integer.parseInt(entry.getKey())).getId()
                                    : stops.getBackStops().get(Integer.parseInt(entry.getKey())).getId();

                            nextArrivals.put(stopId, times);
                        }
                    }
                }

                // Return the map with the next arrival times
                return new ResponseEntity<>(nextArrivals, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Endpoint for updating the stop reached information.
     *
     * @param routeId   the ID of the route
     * @param stopIndex the index of the stop
     * @param direction the direction of the route
     * @return a ResponseEntity indicating the success or failure of the operation
     */
    @PostMapping("/stopReached")
    public ResponseEntity<Boolean> updateStopReached(@RequestParam String routeId, @RequestParam String stopIndex,
            @RequestParam String direction) {
        // Get the Firestore instance
        Firestore db = FirestoreClient.getFirestore();
        // Get the routes collection
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the route document
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Get the current time
                String currentTime = getCurrentTime();

                // Get the history field from the route document
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Check if the history field exists
                if (history != null) {
                    // Get the data for the current date
                    String today = getCurrentDate();
                    Schedule todayData = history.get(today);

                    // Check if the data for the current date exists
                    if (todayData != null) {
                        // Get the timetable for the specified direction
                        Map<String, List<String>> timetable = direction.equals("forward") ? todayData.getForward()
                                : todayData.getBack();

                        // Check if the timetable for the specified direction exists
                        if (timetable != null) {
                            // Update the value for the specified stop index in the timetable with the current time
                            List<String> stopTimes = timetable.get(stopIndex);
                            System.out.println("Stop times: " + stopTimes);
                            if (stopTimes != null) {
                                for (int i = 0; i < stopTimes.size(); i++) {
                                    if (stopTimes.get(i) != null && stopTimes.get(i).equals("-")) {
                                        stopTimes.set(i, currentTime);
                                        break;
                                    }
                                }
                            } else {
                                stopTimes = new ArrayList<>();
                                stopTimes.add(currentTime);
                                timetable.put(stopIndex, stopTimes);
                            }

                            // Update the route document with the new history
                            try {
                                ApiFuture<Boolean> future = db.runTransaction(transaction -> {
                                    DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                                    Route route = routeSnapshotAgain.toObject(Route.class);
                                    if (route != null) {
                                        System.out.println("Updating stop reached for route " + routeId);
                                        System.out.println("Today: " + today);
                                        System.out.println("Today data: " + todayData);

                                        route.getHistory().put(today, todayData);
                                        transaction.update(routeRef, "history", route.getHistory());
                                    }
                                    return true;
                                });

                                // Wait for the transaction to complete
                                Boolean result = future.get();

                                if (result) {
                                    return new ResponseEntity<>(true, HttpStatus.OK);
                                } else {
                                    return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                                }
                            } catch (InterruptedException | ExecutionException e) {
                                return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        }
                    } else {
                        // Initialize the history field for the current date
                        ResponseEntity<Boolean> initializationResult = initializeTodayHistory(routeId);

                        // Check if the initialization was successful
                        if (Boolean.TRUE.equals(initializationResult.getBody())) {
                            // The initialization was successful, now update the stop reached
                            ResponseEntity<Boolean> updateResult = updateStopReached(routeId, stopIndex, direction);

                            // Check if the update was successful
                            if (Boolean.TRUE.equals(updateResult.getBody())) {
                                return new ResponseEntity<>(true, HttpStatus.OK);
                            } else {
                                return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        } else {
                            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                    }
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Initializes the history field for the current date in the given route's document.
     * If the history field already exists, it removes the oldest date if there are more than 7 dates.
     *
     * @param routeId the ID of the route's document
     * @return a ResponseEntity with a boolean indicating whether the initialization was successful
     *         and the appropriate HTTP status code
     * @throws InterruptedException if the current thread is interrupted while waiting
     * @throws ExecutionException if a problem occurs while executing the transaction
     */
    private ResponseEntity<Boolean> initializeTodayHistory(String routeId) throws InterruptedException, ExecutionException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Get the "history" field from the route's document
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Check if the "history" field exists
                if (history != null) {
                    // Create a new "history" field with an empty "Data" object for the current date
                    Map<String, Schedule> newHistory = new HashMap<>();
                    newHistory.put(getCurrentDate(), new Schedule());

                    // Get the "timetable" field from the route's document
                    Schedule timetable = routeSnapshot.toObject(Route.class).getTimetable();

                    // Create a new "Data" object for each day in the "timetable" field, with placeholders
                    // for non-null values
                    Map<String, List<String>> forwardDay = timetable.getForward();
                    replaceNonNullValuesWithPlaceholder(forwardDay);

                    Map<String, List<String>> backDay = timetable.getBack();
                    replaceNonNullValuesWithPlaceholder(backDay);

                    // Add the new "Data" object to the "history" field
                    newHistory.get(getCurrentDate()).setBack(backDay);
                    newHistory.get(getCurrentDate()).setForward(forwardDay);

                    // Update the "history" field in the route's document
                    // If there are more than 7 dates, remove the oldest date
                    db.runTransaction(transaction -> {
                        DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                        Route route = routeSnapshotAgain.toObject(Route.class);
                        if (route != null) {
                            route.getHistory().putAll(newHistory);

                            if (route.getHistory().size() > 7) {
                                // Sort the dates in ascending order
                                List<String> dates = new ArrayList<>(route.getHistory().keySet());
                                Collections.sort(dates, new Comparator<String>() {
                                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

                                    @Override
                                    public int compare(String date1, String date2) {
                                        LocalDate localDate1 = LocalDate.parse(date1, formatter);
                                        LocalDate localDate2 = LocalDate.parse(date2, formatter);
                                        return localDate1.compareTo(localDate2);
                                    }
                                });
                                route.getHistory().remove(dates.get(0));
                            }

                            transaction.update(routeRef, "history", route.getHistory());
                        }
                        return true;
                    });

                    return new ResponseEntity<>(true, HttpStatus.OK);
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Replaces all non-null values in a map with "-" and all null values with null.
     *
     * @param day A map with keys as strings and values as lists of strings.
     */
    private void replaceNonNullValuesWithPlaceholder(Map<String, List<String>> day) {
        // Iterate over the entries in the map
        for (Map.Entry<String, List<String>> entry : day.entrySet()) {
            // Create a new list to store the modified times
            List<String> times = new ArrayList<>();

            // Iterate over the times in the current entry
            for (String time : entry.getValue()) {
                // If the time is not null, add "-" to the new list
                // Otherwise, add null to the new list
                times.add(time != null ? "-" : null);
            }

            // Replace the values in the original map with the modified list
            day.put(entry.getKey(), times);
        }
    }

    /**
     * This method is called when there is a change in direction between forward and back.
     * It fixes gaps in the history of a route.
     *
     * @param routeId The ID of the route.
     * @param direction The direction (forward or back).
     * @return A ResponseEntity indicating the success or failure of the operation.
     */
    @PostMapping("/fixHistoryGaps")
    public ResponseEntity<Boolean> fixHistoryGaps(@RequestParam String routeId, @RequestParam String direction) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the route document
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Get the "history" field from the route document
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Check if the history object exists
                if (history != null) {
                    // Get the current data object from the history
                    String today = getCurrentDate();
                    Schedule todayData = history.get(today);

                    // Check if the current data object exists
                    if (todayData != null) {
                        // Get the timetable object for the specified direction (forward or back)
                        Map<String, List<String>> timetable = direction.equals("forward") ? todayData.getForward()
                                : todayData.getBack();

                        // Check if the timetable object exists
                        if (timetable != null) {
                            // Iterate over each stop in the timetable and fill gaps in the history with null
                            Map<String, List<String>> day = timetable;
                            // Iterate vertically as if it were a matrix
                            int numCols = day.get("0").size();
                            boolean fixed = false; // Fix one column at a time

                            for (int i = 0; i < numCols && !fixed; i++) {
                                int cont = 0;
                                for (int j = 0; j < day.size() - 1; j++) {
                                    if (day.get(String.valueOf(j)).get(i) != null
                                            && day.get(String.valueOf(j)).get(i).equals("-")) {
                                        cont++;
                                    }
                                }
                                if (cont > 0 && cont < day.size() - 1) {
                                    for (int j = 0; j < day.size() - 1; j++) {
                                        if (day.get(String.valueOf(j)).get(i) != null
                                                && day.get(String.valueOf(j)).get(i).equals("-")) {
                                            day.get(String.valueOf(j)).set(i, null);
                                        }
                                    }
                                    fixed = true;
                                }
                            }

                            // Update the "history" field in the route document
                            db.runTransaction(transaction -> {
                                DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                                Route route = routeSnapshotAgain.toObject(Route.class);
                                if (route != null) {
                                    route.getHistory().put(today, todayData);
                                    transaction.update(routeRef, "history", route.getHistory());
                                }
                                return true;
                            });

                            return new ResponseEntity<>(true, HttpStatus.OK);
                        }
                    }
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private static int getSize(Map<String, List<String>> day) {
        return day.size();
    }

    /**
     * Adds a new bus to Firestore and the Realtime Database.
     *
     * @param busCode the code of the bus to be added
     * @param routeId the ID of the route to which the bus belongs
     * @return a ResponseEntity indicating the success of the operation
     */
    @PostMapping("/addBus")
    public ResponseEntity<Boolean> addBus(@RequestParam String busCode, @RequestParam String routeId) {
        // Get Firestore and Realtime Database instances
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the route document corresponding to the given routeId
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();

            // Check if the route exists
            if (routeSnapshot.exists()) {
                // Create a new bus with the given busCode and route reference
                Map<String, Object> data = new HashMap<>();
                data.put("code", busCode);
                data.put("route", routeRef);

                // Get the company from the routeSnapshot
                String company = routeSnapshot.getString("company");
                data.put("company", company);

                // Add the bus to the "buses" collection in Firestore
                DocumentReference newBusRef = buses.add(data).get();

                // Get the ID of the newly created bus
                String busId = newBusRef.getId();

                // Add the bus to the Realtime Database
                DatabaseReference database = FirebaseDatabase.getInstance().getReference();
                DatabaseReference busesRef = database.child("buses").child(busId);

                // Replace the "route" field in data with routeId from parameter
                Map<String, Double> coords = new HashMap<>();
                coords.put("latitude", 0.0);
                coords.put("longitude", 0.0);
                data.put("coords", coords);
                data.put("routeId", routeId);
                data.put("direction", "");
                data.put("lastStop", 0);
                data.put("speed", 0);

                data.remove("code");
                data.remove("route");

                busesRef.setValue(data, new DatabaseReference.CompletionListener() {
                    @Override
                    public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
                        if (databaseError != null) {
                            // Handle errors
                            System.out.println("Data could not be saved: " + databaseError.getMessage());
                        } else {
                            System.out.println("Bus added to Realtime Database successfully!");
                        }
                    }
                });

                return new ResponseEntity<>(true, HttpStatus.OK);
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get a list of routes by the bus code.
     *
     * @param busCode The code of the bus.
     * @return A response entity containing a list of routes if found, otherwise a not found response.
     */
    @GetMapping("/routesByBusCode")
    public ResponseEntity<List<Route>> getRoutesByBusCode(@RequestParam String busCode) {
        // Get the Firestore instance and the "buses" and "routes" collection references
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Query the "buses" collection for the bus with the given code
            Query query = buses.whereEqualTo("code", busCode);
            QuerySnapshot querySnapshot = query.get().get();

            // If no bus is found, return a not found response
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Get the first document matching the query
            DocumentSnapshot busDocument = querySnapshot.getDocuments().get(0);

            // Get the company of the bus
            String company = busDocument.getString("company");

            // Get all routes of the company
            Query queryRoutes = routes.whereEqualTo("company", company);
            QuerySnapshot querySnapshotRoutes = queryRoutes.get().get();
            List<Route> routesList = new ArrayList<>();

            // Iterate over the documents and convert them to Route objects
            for (DocumentSnapshot document : querySnapshotRoutes.getDocuments()) {
                Route route = document.toObject(Route.class);
                route.setStops(null);
                route.setTimetable(null);
                route.setHistory(null);
                routesList.add(route);
            }

            // Return the list of routes
            return new ResponseEntity<>(routesList, HttpStatus.OK);
        } catch (Exception e) {
            // Handle any exceptions and return an internal server error response
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the route of a bus with the given bus code to the new route with the given route ID.
     *
     * @param busCode the code of the bus to be updated
     * @param routeId the ID of the new route to set for the bus
     * @return a ResponseEntity indicating the success of the operation
     */
    @PostMapping("/updateBusRoute")
    public ResponseEntity<Boolean> updateBusRoute(@RequestParam String busCode, @RequestParam String routeId) {
        // Get Firestore and Realtime Database instances
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Query the "buses" collection for the bus with the given code
            Query query = buses.whereEqualTo("code", busCode);
            QuerySnapshot querySnapshot = query.get().get();

            // If no bus is found, return a not found response
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
            }

            // Get the first document matching the query
            DocumentSnapshot busDocument = querySnapshot.getDocuments().get(0);

            // Update the "route" field of the bus document with the new route reference
            DocumentReference routeRef = routes.document(routeId);
            busDocument.getReference().update("route", routeRef);

            // Update the Realtime Database with the new route ID
            DatabaseReference database = FirebaseDatabase.getInstance().getReference();
            DatabaseReference busesRef = database.child("buses").child(busDocument.getId());

            // Create a map of values to update the "routeId" field in the Realtime Database
            Map<String, Object> update = new HashMap<>();
            update.put("routeId", routeId);

            // Perform the update in the Realtime Database
            busesRef.updateChildren(update, new DatabaseReference.CompletionListener() {
                @Override
                public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
                    if (databaseError != null) {
                        // Handle any errors
                        System.out.println("Data could not be saved: " + databaseError.getMessage());
                    } else {
                        System.out.println("Bus route updated in Realtime Database successfully!");
                    }
                }
            });

            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get the company name by email from the Firestore "companies" collection.
     *
     * @param email The email of the company.
     * @return A response entity containing the company name if found, otherwise a not found response.
     */
    @GetMapping("/companyByEmail")
    public ResponseEntity<String> getCompanyByEmail(@RequestParam String email) {
        // Get the Firestore instance and the "companies" collection reference
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference companies = db.collection(COMPANIES_COLLECTION);

        try {
            // Query the "companies" collection for the company with the given email
            Query query = companies.whereEqualTo("email", email);
            QuerySnapshot querySnapshot = query.get().get();

            // If no company is found, return a not found response
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Get the first document matching the query
            DocumentSnapshot companyDocument = querySnapshot.getDocuments().get(0);

            // Get the company name from the document
            String company = companyDocument.getString("name");

            // Return the company name in a response entity with an OK status
            return new ResponseEntity<>(company, HttpStatus.OK);
        } catch (Exception e) {
            // Handle any exceptions and return an internal server error response
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Calculates the average delay of a bus based on the bus's ID and direction.
     *
     * @param busId The ID of the bus.
     * @param direction The direction of the bus (forward or back).
     * @return A response entity containing the average delay if successful, otherwise an error response.
     */
    @GetMapping("/avg-bus-delay")
    public ResponseEntity<Integer> getAvgBusDetails(@RequestParam String busId, @RequestParam String direction) {
        // Get Firestore instance and references to the "buses" and "routes" collections
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the bus document
            DocumentSnapshot busDocument = getDocumentById(buses, busId);

            DocumentReference routeRef = (DocumentReference) busDocument.get("route");
            DocumentSnapshot routeDocument = routeRef.get().get();
            Route route = routeDocument.toObject(Route.class);

            // Get the delays schedule for the route
            Schedule delays = route.getDelays();

            // Check if the delays schedule is valid
            if (!checkDelaysIntegrity(delays)) {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Calculate the average delay
            Schedule timetable = route.getTimetable();

            // Get the timetable direction based on the requested direction
            Map<String, List<String>> timetableDirection = direction.equals("forward") ? timetable.getForward() : timetable.getBack();

            // Get the delays direction based on the requested direction
            Map<String, List<String>> delaysDirection = direction.equals("forward") ? delays.getForward() : delays.getBack();

            // Calculate the total delay and the number of delays
            int totalDelay = 0;
            int numDelays = 0;
            for (Map.Entry<String, List<String>> entry : timetableDirection.entrySet()) {
                List<String> timetableTimes = entry.getValue();
                List<String> delaysTimes = delaysDirection.get(entry.getKey());
                for (int i = 0; i < timetableTimes.size(); i++) {
                    if (delaysTimes.get(i) != null && !delaysTimes.get(i).equals("-")) {
                        totalDelay += getDelay(timetableTimes.get(i), delaysTimes.get(i));
                        numDelays++;
                    }
                }
            }

            // Calculate the average delay and return it in a response entity
            int avgDelay = numDelays > 0 ? totalDelay / numDelays : 0;
            return new ResponseEntity<>(avgDelay, HttpStatus.OK);

        } catch (Exception e) {
            // Handle any exceptions and return an internal server error response
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the current delay of a bus. The delay is calculated by comparing the current time
     * with the timetable time of the bus.
     * 
     * @param busId     the ID of the bus
     * @param direction the direction of the bus (forward or back)
     * @return a response entity containing the delay if successful, otherwise an error response
     */
    @GetMapping("/current-bus-delay")
    public ResponseEntity<Integer> getCurrentDelay(@RequestParam String busId, @RequestParam String direction) {
        // Get Firestore instance and references to the "buses" and "routes" collections
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            // Get the bus document
            DocumentSnapshot busDocument = getDocumentById(buses, busId);

            DocumentReference routeRef = (DocumentReference) busDocument.get("route");
            DocumentSnapshot routeDocument = routeRef.get().get();
            Route route = routeDocument.toObject(Route.class);

            // Calculate the current delay
            Schedule timetable = route.getTimetable();
            Map<String, List<String>> timetableDirection = direction.equals("forward") ? timetable.getForward()
                    : timetable.getBack();

            Map<String, Schedule> history = route.getHistory();
            // Check if the history object exists
            if (history != null) {
                // Get the current data object from the history
                String today = getCurrentDate();
                Schedule todayData = history.get(today);

                // Check if the current data object exists
                if (todayData != null) {
                    // Get the timetable object for the specified direction (forward or back)
                    Map<String, List<String>> day = direction.equals("forward") ? todayData.getForward()
                            : todayData.getBack();

                    int numCols = day.get("0").size();

                    // Iterate over the timetable in reverse order to find the last non-null value
                    for (int i = numCols - 1; i >= 0; i--) {
                        for (int j = day.size() - 1; j >= 0; j--) {
                            if (day.get(String.valueOf(j)).get(i) != null && !day.get(String.valueOf(j)).get(i).equals("-")) {
                                return new ResponseEntity<>(getDelay(timetableDirection.get(String.valueOf(j)).get(i),
                                        day.get(String.valueOf(j)).get(i)), HttpStatus.OK);
                            }
                        }
                    }

                    return new ResponseEntity<>(0, HttpStatus.OK);
                }
            }

            return new ResponseEntity<>(0, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Calculates the delay between the timetable time and the delay time.
     *
     * @param timetableTime The time from the timetable in the format "HH:mm"
     * @param delayTime     The actual time in the format "HH:mm"
     * @return The delay in minutes
     */
    private int getDelay(String timetableTime, String delayTime) {
        // Split the timetable and delay times into hours and minutes
        String[] timetableParts = timetableTime.split(":");
        String[] delayParts = delayTime.split(":");

        // Calculate the timetable minutes and delay minutes
        int timetableMinutes = Integer.parseInt(timetableParts[0]) * 60 + Integer.parseInt(timetableParts[1]);
        int delayMinutes = Integer.parseInt(delayParts[0]) * 60 + Integer.parseInt(delayParts[1]);

        // Calculate and return the delay in minutes
        return delayMinutes - timetableMinutes;
    }


}
