package com.example.busbuddy_backend.persistence;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Component
public class FirestoreInitializer {

    @PostConstruct
    public void initialize() {
        try {
            // Load environment variables from .env file
            Dotenv dotenv = Dotenv.configure().load();

            // Get the Firebase service account key from environment variables
            String serviceAccountJson = dotenv.get("FIREBASE_SERVICE_ACCOUNT_KEY");

            // Convert the service account JSON string to InputStream
            InputStream serviceAccount = new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8));

            // Configure Firebase options using the loaded credentials
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl("https://busbus-19997-default-rtdb.europe-west1.firebasedatabase.app")
                    .build();

            // Initialize Firebase application with the configured options
            FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
