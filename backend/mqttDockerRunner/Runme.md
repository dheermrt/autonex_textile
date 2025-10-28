### 1st time:

docker build -t my-mosquitto .
docker run -it --rm --name mosquitto-autonex -p 1883:1883 my-mosquitto

----------------------------------

### Every other time:
docker run -it --rm --name mosquitto-autonex -p 1883:1883 my-mosquitto