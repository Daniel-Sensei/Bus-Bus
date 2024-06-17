package com.example.busbuddy_backend.persistence;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Component
public class FirestoreInitializer {

    /**
     * This method initializes the Firebase application with the provided
     * service account credentials and database URL.
     *
     * @PostConstruct annotation is used to indicate that this method should be
     * executed after the dependency injection process has completed.
     */
    @PostConstruct
    public void initialize() {
        try {
            // Load the service account key file from the classpath
            InputStream serviceAccount =
                    new ClassPathResource("serviceAccountKey.json").getInputStream();

            // Configure Firebase options using the loaded credentials
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl("https://busbus-19997-default-rtdb.europe-west1.firebasedatabase.app")
                    .build();

            // Initialize Firebase application with the configured options
            FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            // Print the stack trace if there is an error loading the service account file
            e.printStackTrace();
        }
    }
}
