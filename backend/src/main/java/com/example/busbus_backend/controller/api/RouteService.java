package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.ForwardBackStops;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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




    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }


}
