package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Bus;
import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.ForwardBackStops;
import com.google.cloud.firestore.DocumentReference;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.concurrent.ExecutionException;

@RestController
@CrossOrigin("http://localhost:8100/")
public class BusService {
    private final String COLLECTION_NAME = "buses"; // Nome della collezione in Firestore

    @GetMapping("/bus")
    public ResponseEntity<Bus> getBus(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(COLLECTION_NAME);

        try {
            DocumentSnapshot document = getDocumentById(buses, id);
            if (document.exists()) {
                DocumentReference routeRef = (DocumentReference) document.get("route");
                //get document of route
                DocumentSnapshot routeDocument = routeRef.get().get();
                Route route = routeDocument.toObject(Route.class);
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);
                route.setStops(stops);

                //set bus field individually
                Bus bus = new Bus();
                bus.setId(document.getId());
                bus.setRoute(route);

                return new ResponseEntity<>(bus, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }

}
