package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.ForwardBackStops;
import com.example.busbus_backend.persistence.model.Schedule;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@CrossOrigin("http://localhost:8100/")
public class RouteService {

    private final String COLLECTION_NAME = "routes"; // Nome della collezione in Firestore

    @GetMapping("/route")
    public ResponseEntity<Route> getRoute(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(COLLECTION_NAME);

        try {
            DocumentSnapshot document = getDocumentById(routes, id);
            if (document.exists()) {
                Route route = document.toObject(Route.class);

                ForwardBackStops stops = route.buildStopOutboundReturn(document);
                route.setStops(stops);

                return new ResponseEntity<>(route, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    // Restituisce tutti i percorsi, effettuando un raggruppamento per "company"
    @GetMapping("/allRoutes")
    public ResponseEntity<Map<String, List<Route>>> getAllRoutes() {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(COLLECTION_NAME);

        try {
            List<Route> allRoutes = routes.get().get().toObjects(Route.class);

            // Creazione di una mappa per raggruppare i percorsi per "company"
            Map<String, List<Route>> groupedRoutes = new HashMap<>();

            for (Route route : allRoutes) {
                String company = route.getCompany();
                if (company != null) {
                    // Se la chiave non esiste già, aggiungi una nuova voce con un nuovo ArrayList
                    groupedRoutes.putIfAbsent(company, new ArrayList<>());
                    // Aggiungi la rotta alla lista esistente
                    groupedRoutes.get(company).add(route);
                }
            }

            return new ResponseEntity<>(groupedRoutes, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/stopReached")
    public ResponseEntity<Boolean> updateStopReached(@RequestParam String routeId, @RequestParam String stopIndex, @RequestParam String direction) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(COLLECTION_NAME);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Ottenere l'orario attuale (hh:mm)
                String currentTime = getCurrentTime();

                // Ottenere il campo "history" dal documento del percorso
                Map<String, Route.Data> history = routeSnapshot.toObject(Route.class).getHistory();

                // Verificare se l'oggetto history esiste
                if (history != null) {
                    // Ottenere l'oggetto Data per la data odierna
                    String today = getCurrentDate();
                    Route.Data todayData = history.get(today);

                    // Verificare se l'oggetto Data per la data odierna esiste
                    if (todayData != null) {
                        // Ottenere l'oggetto Timetable per la direzione specificata (forward o back)
                        Schedule.Timetable timetable = direction.equals("forward") ? todayData.getForward() : todayData.getBack();

                        // Verificare se il campo timetable per la direzione specificata esiste
                        if (timetable != null) {
                            // Aggiornare il valore per lo stopIndex specificato nell'oggetto Timetable con l'orario attuale
                            // Se è domenica, aggiungere l'orario all'oggetto "sunday" invece di "week"
                            List<String> stopTimes = isSunday() ? timetable.getSunday().get(stopIndex) : timetable.getWeek().get(stopIndex);
                            if (stopTimes != null) {
                                stopTimes.add(currentTime);
                            } else {
                                stopTimes = new ArrayList<>();
                                stopTimes.add(currentTime);
                                timetable.getWeek().put(stopIndex, stopTimes);
                            }

                            // Aggiornare il campo "history" nel documento del percorso
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

    // Restituisce true se oggi è domenica, altrimenti false
    private boolean isSunday() {
        return LocalDate.now().getDayOfWeek().toString().equals("SUNDAY");
    }

    // Restituisce la data odierna nel formato "dd-MM-yyyy"
    // Non prendere la data dal client, ma calcolala lato server
    private String getCurrentDate() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
    }

    // Restituisce l'orario attuale nel formato "HH:mm"
    // Non prendere l'orario dal client, ma calcolalo lato server
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }


}
