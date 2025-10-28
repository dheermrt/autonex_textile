FROM eclipse-mosquitto:latest

# Create a custom config directly inside the image
RUN mkdir -p /mosquitto/config /mosquitto/data /mosquitto/log \
 && echo "listener 1883" > /mosquitto/config/mosquitto.conf \
 && echo "allow_anonymous true" >> /mosquitto/config/mosquitto.conf \
 && echo "persistence true" >> /mosquitto/config/mosquitto.conf \
 && echo "persistence_location /mosquitto/data/" >> /mosquitto/config/mosquitto.conf \
 && echo "log_dest stdout" >> /mosquitto/config/mosquitto.conf

EXPOSE 1883 9001

CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]
