# This docker file is used for building of the local addon image only. Only for development purposes!
# Actually addon is built by HA itself.

ARG BUILD_FROM=homeassistant/amd64-base:latest
FROM $BUILD_FROM
# Add env
ENV LANG C.UTF-8

ENV YANDEX2MQTT_VERSION=0.3.0
ENV YDIR=y2m

RUN apk add --update --no-cache curl jq nodejs npm git && \
  cd / && \
  git clone https://github.com/dparhonin/yandex2mqtt.git $YDIR && \
  cd  $YDIR && \
  npm install --unsafe-perm -g pm2 && \
  npm install --unsafe-perm && \  
  rm -rf LICENSE README.md Dockerfile build.sh devices.json

#Addon custom options
COPY config.js /$YDIR/
COPY devices.json /share/$YDIR/
COPY run.sh /$YDIR/

ENV DEBUG=y2m.*

WORKDIR /$YDIR/

RUN ["chmod", "a+x", "./run.sh"]
CMD [ "./run.sh" ]