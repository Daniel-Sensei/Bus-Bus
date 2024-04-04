package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.ForwardBackStops;
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

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }

}
