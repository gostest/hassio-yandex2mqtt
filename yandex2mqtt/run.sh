#!/bin/bash

CONFIG_PATH=/data/options.json

# RUN yandex2mqtt
DEBUG=$(jq --raw-output ".debug" $CONFIG_PATH) pm2-runtime start npm -- start
