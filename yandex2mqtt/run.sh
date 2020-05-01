#!/bin/bash

CONFIG_PATH=/data/options.json
DATA_PATH=$(jq --raw-output ".data_path" $CONFIG_PATH)

# Check if config exists already
mkdir -p $DATA_PATH

# Parse config
cp $CONFIG_PATH .

# RUN yandex2mqtt
YANDEX2MQTT_DATA="$DATA_PATH" DEBUG=$(jq --raw-output ".debug" $CONFIG_PATH) pm2-runtime start npm -- start
