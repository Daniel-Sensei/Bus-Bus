package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.ForwardBackStops;
import com.example.busbus_backend.persistence.model.Schedule;
import com.example.busbus_backend.persistence.model.Stop;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@CrossOrigin("*")
public class RouteService {

    private final String ROUTES_COLLECTION = "routes"; // Nome della collezione in Firestore
    private final String STOPS_COLLECTION = "stops";

    @GetMapping("/route")
    public ResponseEntity<Route> getRoute(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

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
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            List<Route> allRoutes = routes.get().get().toObjects(Route.class);
            for (Route route : allRoutes) {
                DocumentSnapshot document = getDocumentById(routes, route.getId());
                ForwardBackStops stops = route.buildStopOutboundReturn(document);
                route.setStops(stops);
            }

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

    @PostMapping("/addRouteAndStops")
    public ResponseEntity<Boolean> addRoute(@RequestBody Route route) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        //List<Stop> stopsToAdd = new ArrayList<>();
        //List<DocumentReference> stopsAlreadyIn = new ArrayList<>();

        try {
            //controlla che non sia gia presente una route con lo stesso code e company
            List<QueryDocumentSnapshot> routeList = routes.whereEqualTo("code", route.getCode()).whereEqualTo("company", route.getCompany()).get().get().getDocuments();
            if (!routeList.isEmpty()) {
                return new ResponseEntity<>(false, HttpStatus.CONFLICT);
            }

            List<DocumentReference> stopsForwardRefsToAddInRoute = new ArrayList<>();
            List<DocumentReference> stopsBackRefsToAddInRoute = new ArrayList<>();

            //FORWARD
            List<Stop> forwardStops = route.getStops().getForwardStops();
            for (Stop stop : forwardStops) {
                List<QueryDocumentSnapshot> stopList = stops.whereEqualTo("address", stop.getAddress()).get().get().getDocuments();
                if (stopList.isEmpty()) {
                    //aggiungi lo stop e salva la reference
                    DocumentReference stopRef = stops.add(stop).get();
                    stopsForwardRefsToAddInRoute.add(stopRef);
                }
                else {
                    stopsForwardRefsToAddInRoute.add(stopList.get(0).getReference());
                }
            }

            //BACK
            List<Stop> backStops = route.getStops().getBackStops();
            for (Stop stop : backStops) {
                List<QueryDocumentSnapshot> stopList = stops.whereEqualTo("address", stop.getAddress()).get().get().getDocuments();
                if (stopList.isEmpty()) {
                    //aggiungi lo stop e salva la reference
                    DocumentReference stopRef = stops.add(stop).get();
                    stopsBackRefsToAddInRoute.add(stopRef);
                }
                else {
                    stopsBackRefsToAddInRoute.add(stopList.get(0).getReference());
                }
            }

            System.out.println("stopsForwardRefsToAddInRoute: " + stopsForwardRefsToAddInRoute);
            System.out.println("stopsBackRefsToAddInRoute: " + stopsBackRefsToAddInRoute);

            //aggiungi route al db senza i riferimenti degli stop
            //non far comparire proprio i campi backStops e forwardStops nel db
            route.setStops(null);
            DocumentReference routeRef = routes.add(route).get();
            //aggiungi i riferimenti degli stop nel campo stops (forward e back) del documento route
            routeRef.update("stops.forward", stopsForwardRefsToAddInRoute);
            routeRef.update("stops.back", stopsBackRefsToAddInRoute);

            //aggiungi il riferimento del documento route nel campo routes di ogni stop
            //sia per gli stop appena aggiunti che per quelli già presenti nel db
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

    @DeleteMapping("/deleteRoute")
    public ResponseEntity<Boolean> deleteRoute(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);
        CollectionReference stops = db.collection(STOPS_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(routes, id);
            if (document.exists()) {
                Set<DocumentReference> stopsRefs = new HashSet<>();
                //rimuovi il riferimento del documento route nel campo routes di ogni stop
                List<DocumentReference> stopsForwardRefs = (List<DocumentReference>) document.get("stops.forward");
                List<DocumentReference> stopsBackRefs = (List<DocumentReference>) document.get("stops.back");
                stopsRefs.addAll(stopsForwardRefs);
                stopsRefs.addAll(stopsBackRefs);
                for (DocumentReference stopRef : stopsRefs) {
                    stopRef.update("routes", FieldValue.arrayRemove(document.getReference()));
                }

                //rimuovi il documento route dal db
                document.getReference().delete();
            } else {
                return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    @GetMapping("/updateDelays")
    public ResponseEntity<Boolean> updateDelay(@RequestParam String routeId) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(routes, routeId);
            if (document.exists()) {
                //la funzione si occupa di aggiungere una nuova mappa nel database chiamata "delays"
                //la mappa è di tipo Schedule come per timetable
                //"timetable" registra gli orari statitici dei pullman, mentre "delays" salva gli orari in base ai dati precedentementi raccolti in ogni data di "history"
                //la funzione si occupa di aggiornare "delays" in base ai dati di "history"
                //bisgona scorrere in ogni data di "history" e calcolare la media degli arrivi per ogni fermata
                //la differenza media viene calcolata per ogni fermata e salvata in "delays"
                //la funzione ritorna true se l'operazione è andata a buon fine, false altrimenti
                //se la route non esiste ritorna NOT_FOUND
                //se c'è un errore ritorna INTERNAL_SERVER_ERROR

                Route route = document.toObject(Route.class);
                Map<String, Schedule> history = route.getHistory();
                if (history != null) {
                    Schedule delays = new Schedule();
                    boolean isDelaysEmpty = true;
                    for (Map.Entry<String, Schedule> entry : history.entrySet()) {
                        String date = entry.getKey();
                        Schedule schedule = entry.getValue();
                        Map<String, List<String>> forward = schedule.getForward();
                        Map<String, List<String>> back = schedule.getBack();
                        System.out.println("date: " + date);
                        System.out.println("forward: " + forward);
                        System.out.println("back: " + back);

                        if(isDelaysEmpty) {
                            delays.setForward(forward);
                            delays.setBack(back);
                            System.out.println("delays: " + delays);
                            isDelaysEmpty = false;
                            continue;
                        }

                        //FORWARD
                        for (Map.Entry<String, List<String>> entryForward : forward.entrySet()) {
                            String stop = entryForward.getKey();
                            List<String> times = entryForward.getValue();
                            //scorri times con un indice per confrontarlo con i valori gia presenti in delays
                            for (int i = 0; i < times.size(); i++) {
                                String time = times.get(i);
                                if (time == null) {
                                    continue;
                                }
                                List<String> delaysTimes = delays.getForward().get(stop);
                                String delayTime = delaysTimes.get(i);
                                if (delayTime != null) {
                                    delaysTimes.set(i, averageTime(delayTime, time));
                                }
                                else {
                                    delaysTimes.set(i, time);
                                }
                            }
                        }
                        //BACK
                        for (Map.Entry<String, List<String>> entryBack : back.entrySet()) {
                            String stop = entryBack.getKey();
                            List<String> times = entryBack.getValue();
                            //scorri times con un indice per confrontarlo con i valori gia presenti in delays
                            for (int i = 0; i < times.size(); i++) {
                                String time = times.get(i);
                                if (time == null) {
                                    continue;
                                }
                                List<String> delaysTimes = delays.getBack().get(stop);
                                String delayTime = delaysTimes.get(i);
                                if (delayTime != null) {
                                    delaysTimes.set(i, averageTime(delayTime, time));
                                }
                                else {
                                    delaysTimes.set(i, time);
                                }
                            }
                        }

                        System.out.println("delays: " + delays);
                    }
                    document.getReference().update("delays", delays);
                }
                else {
                    System.out.println("history is null");
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

    private String averageTime(String time1, String time2) {
        //time1 e time2 sono in formato "HH:mm"
        String[] time1Split = time1.split(":");
        String[] time2Split = time2.split(":");
        int hour1 = Integer.parseInt(time1Split[0]);
        int minute1 = Integer.parseInt(time1Split[1]);
        int hour2 = Integer.parseInt(time2Split[0]);
        int minute2 = Integer.parseInt(time2Split[1]);
        int totalMinutes1 = hour1 * 60 + minute1;
        int totalMinutes2 = hour2 * 60 + minute2;
        int averageTotalMinutes = (totalMinutes1 + totalMinutes2) / 2;
        int averageHour = averageTotalMinutes / 60;
        int averageMinute = averageTotalMinutes % 60;
        return averageHour + ":" + averageMinute;
    }

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }



}
