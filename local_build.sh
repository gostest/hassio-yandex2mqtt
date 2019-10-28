#!/bin/bash
set -ev

echo "Running local build test."

# build zigbee2mqtt
docker run -it --rm --privileged --name "yandex2mqtt" \
    -v ~/.docker:/root/.docker \
    -v "$(pwd)":/docker \
    hassioaddons/build-env:latest \
    --target "yandex2mqtt" \
    --tag-test \
    --armhf \
    --from "homeassistant/{arch}-base" \
    --author "Egor Osipov <gostest@gmail.com>" \
    --doc-url "https://github.com/gostest/hassio-yandex2mqtt" \
    --parallel
