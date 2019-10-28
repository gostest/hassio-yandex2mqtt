ARG BUILD_FROM
FROM $BUILD_FROM
# Add env
ENV LANG C.UTF-8

ENV YANDEX2MQTT_VERSION=0.1.0
ENV YDIR=yandex2mqtt

RUN apk add --update --no-cache curl jq nodejs npm \
    python2 make gcc g++ linux-headers udev git python2 && \
  cd / && \
  git clone https://github.com/munrexio/yandex2mqtt.git && \
  cd  $YDIR && \
  npm install --unsafe-perm -g pm2 && \
  npm install --unsafe-perm && \
  apk del make gcc g++ python2 linux-headers udev && \
  rm -rf docs test images scripts data docker LICENSE README.md update.sh

COPY config.js "/$YDIR/config.js"
COPY access_tokens.js "/$YDIR/db/access_tokens.js"
COPY run.sh "/$YDIR/run.sh"
WORKDIR "/$YDIR"

RUN ["chmod", "a+x", "./run.sh"]
CMD [ "./run.sh" ]
