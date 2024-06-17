package com.example.busbuddy_backend.controller.api;

import com.example.busbuddy_backend.persistence.TokenManager;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
@CrossOrigin("*")
public class LoginService {
    /**
     * This endpoint generates a custom token using the provided UID.
     * The UID is first checked against the Firebase authentication.
     * If the UID exists, a token is generated and returned in the response body.
     * If the UID does not exist, a 404 status code is returned.
     *
     * @param uid The user ID to generate a token for.
     * @return The generated token if the UID exists, 404 status code otherwise.
     */
    @GetMapping("generate-custom-token")
    public ResponseEntity<String> generateCustomToken(@RequestParam String uid) {
        try {
            // Check if the UID exists in the Firebase authentication
            FirebaseAuth.getInstance().getUser(uid);

            // If the UID exists, generate a token
            Date now = new Date();
            Date expiration = new Date(now.getTime() + TokenManager.getExpirationTimeMs());

            // Generate the token
            String token = Jwts.builder()
                    .setSubject(uid) // Set the subject of the token to the UID
                    .setIssuedAt(now) // Set the issue date of the token to the current date
                    .setExpiration(expiration) // Set the expiration date of the token
                    .signWith(SignatureAlgorithm.HS256, TokenManager.getSecretKey()) // Sign the token with the secret key
                    .compact(); // Compact the token into a string

            return ResponseEntity.ok(token); // Return the token in the response body
        } catch (FirebaseAuthException e) {
            // If the UID does not exist, return a 404 status code
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * This endpoint verifies a custom token.
     * It expects the token to be provided in the Authorization header of the request.
     * If the token is valid, it returns a 200 OK response with a true value in the response body.
     * If the token is not valid, it returns a 401 Unauthorized response with a false value in the response body.
     *
     * @param token The custom token to be verified, provided in the Authorization header of the request.
     * @return A ResponseEntity with a boolean value indicating the validity of the token.
     *         If the token is valid, the response has a 200 OK status code and a true value in the body.
     *         If the token is not valid, the response has a 401 Unauthorized status code and a false value in the body.
     */
    @GetMapping("verify-custom-token")
    public ResponseEntity<Boolean> verifyCustomToken(@RequestHeader("Authorization") String token) {
        try {
            // Remove the "Bearer " prefix from the token
            token = token.substring(7);
            
            // Parse the token and verify its signature
            Jwts.parser()
                    .setSigningKey(TokenManager.getSecretKey())
                    .parseClaimsJws(token);
            
            // Print the expiration date of the token for debugging purposes
            System.out.println("Scadenza: " +
                    Jwts.parser()
                            .setSigningKey(TokenManager.getSecretKey())
                            .parseClaimsJws(token)
                            .getBody()
                            .getExpiration());
            
            // Return a 200 OK response with a true value in the response body
            return ResponseEntity.ok(true);
        } catch (Exception e) {
            // Return a 401 Unauthorized response with a false value in the response body
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(false);
        }
    }
}
