package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.Schedule;
import com.example.busbus_backend.persistence.model.Stop;
import com.google.api.core.ApiFuture;
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

import static java.awt.geom.Point2D.distance;

@RestController
@CrossOrigin("*")
public class StopService {
    private final String STOPS_COLLECTION = "stops"; // Nome della collezione in Firestore
    private final String ROUTES_COLLECTION = "routes";

    @GetMapping("/stop")
    public ResponseEntity<Stop> getStop(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(stops, id);
            if (document.exists()) {
                Stop stop = document.toObject(Stop.class);

                return new ResponseEntity<>(stop, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/stopsWithinRadius")
    public ResponseEntity<List<Stop>> getStopsWithinRadius(@RequestParam double latitude, @RequestParam double longitude, @RequestParam double radius) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        // ottieni tutti gli stop e successivamente rimuovi quelli fuori dal raggio (espresso in metri)
        try {
            List<Stop> allStops = stops.get().get().toObjects(Stop.class);
            List<Stop> inRadiusStops = new ArrayList<>();
            for (Stop stop : allStops) {
                if (isWithinRadius(latitude, longitude, radius, stop)) {
                    inRadiusStops.add(stop);
                }
            }

            // order stops by distance
            inRadiusStops.sort((s1, s2) -> {
                double d1 = distance(latitude, longitude, s1.getCoords().getLatitude(), s1.getCoords().getLongitude());
                double d2 = distance(latitude, longitude, s2.getCoords().getLatitude(), s2.getCoords().getLongitude());
                return Double.compare(d1, d2);
            });
            return new ResponseEntity<>(inRadiusStops, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean isWithinRadius(double latitude, double longitude, double radius, Stop stop) {
        // Converti le coordinate in radianti
        double lat1 = Math.toRadians(latitude);
        double lon1 = Math.toRadians(longitude);
        double lat2 = Math.toRadians(stop.getCoords().getLatitude());
        double lon2 = Math.toRadians(stop.getCoords().getLongitude());

        // Calcola la differenza tra le coordinate
        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        // Formula di Haversine per calcolare la distanza
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = 6371000 * c; // Raggio medio della Terra in metri

        // Verifica se la distanza è all'interno del raggio specificato
        return distance <= radius;
    }

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

                            Schedule schedule = route.getTimetable();

                            List<String> forward =schedule.getForward().get(String.valueOf(indexForward));
                            List<String> back =schedule.getBack().get(String.valueOf(indexBack));

                            if(backDay != null) {
                                String destination = route.getCode().split("_")[1];
                                //ordina al contrario la destinazione splittando per "-"
                                //esempio: "A-B" diventa "B-A"
                                //la destinazione potrebbe avere più di un "-"
                                //quindi prendi la''ray splittato e ordina al contrario tutto
                                String[] destinationArray = destination.split("-");
                                String invertedDestination = "";
                                for (int i = destinationArray.length - 1; i >= 0; i--) {
                                    invertedDestination += destinationArray[i] + "-";
                                }
                                invertedDestination = invertedDestination.substring(0, invertedDestination.length() - 1);

                                nextBuses.put(route.getCode().split("_")[0] + "_" + destination, forward.subList(startIndexForward, forward.size()));
                                nextBuses.put(route.getCode().split("_")[0] + "_" + invertedDestination, back.subList(startIndexBack, back.size()));
                            } else {
                                nextBuses.put(route.getCode(), forward.subList(startIndexForward, forward.size()));
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

    private String getCurrentDate() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
    }

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }
}
