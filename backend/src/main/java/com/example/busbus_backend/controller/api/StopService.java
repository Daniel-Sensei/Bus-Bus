package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.Stop;
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

import java.util.concurrent.ExecutionException;

@RestController
@CrossOrigin("http://localhost:8100/")
public class StopService {
    private final String COLLECTION_NAME = "stops"; // Nome della collezione in Firestore

    @GetMapping("/stop")
    public ResponseEntity<Stop> getStop(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference stops = db.collection(COLLECTION_NAME);

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

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }
}
