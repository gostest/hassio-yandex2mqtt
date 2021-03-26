ARG BUILD_FROM=homeassistant/amd64-base:latest
FROM $BUILD_FROM
# Add env
ENV LANG C.UTF-8

ENV YDIR=y2m

WORKDIR /$YDIR

COPY run.sh /$YDIR/
COPY *.js /$YDIR/
COPY package.json /$YDIR/
COPY package-lock.json /$YDIR/
COPY devices.json /share/$YDIR/
COPY mappings.json /share/$YDIR/
COPY auth/* /$YDIR/auth/
COPY db/* /$YDIR/db/
COPY routes/* /$YDIR/routes/
COPY utils/* /$YDIR/utils/
COPY views/* /$YDIR/views/

# Setup all NodeJS dependencies from package.json
RUN apk add --update --no-cache curl jq nodejs npm && \
  npm install --unsafe-perm -g pm2 && \
  npm install --unsafe-perm
RUN dos2unix run.sh

RUN ["chmod", "a+x", "/y2m/run.sh"]
CMD [ "./run.sh" ]