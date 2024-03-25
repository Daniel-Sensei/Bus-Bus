FROM adoptopenjdk/openjdk17:jdk-17.0.10_12-alpine

VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
EXPOSE 8080
