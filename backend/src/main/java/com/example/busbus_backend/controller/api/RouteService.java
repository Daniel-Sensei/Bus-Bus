package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Route;
import com.example.busbus_backend.persistence.model.StopOutboundReturn;
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
import java.util.List;
import java.util.concurrent.ExecutionException;
import com.google.cloud.firestore.DocumentReference;
import com.example.busbus_backend.persistence.model.Stop;

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
                route.setId(document.getId());

                StopOutboundReturn stops = buildStopOutboundReturn(document);
                route.setStops(stops);

                return new ResponseEntity<>(route, HttpStatus.OK);
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

    private StopOutboundReturn buildStopOutboundReturn(DocumentSnapshot document) throws InterruptedException, ExecutionException {
        List<Stop> outboundStops = buildStopList(document, "stops.forward");
        List<Stop> returnStops = buildStopList(document, "stops.back");

        StopOutboundReturn stops = new StopOutboundReturn();
        stops.setForwardStops(outboundStops);
        stops.setBackStops(returnStops);

        return stops;
    }

    private List<Stop> buildStopList(DocumentSnapshot document, String fieldPath) throws InterruptedException, ExecutionException {
        List<DocumentReference> stopRefs = (List<DocumentReference>) document.get(fieldPath);
        List<Stop> stops = new ArrayList<>();
        if (stopRefs != null) {
            for (DocumentReference stopRef : stopRefs) {
                Stop stop = stopRef.get().get().toObject(Stop.class);
                stop.setId(stopRef.getId());
                stops.add(stop);
            }
        }
        return stops;
    }


}
