#!/bin/bash
set -ev

echo "Running local build test."

# build yandex2mqtt
sudo docker run -it --rm --privileged --name "yandex2mqtt" \
    -v ~/.docker:/root/.docker \
    -v "$(pwd)":/docker \
    hassioaddons/build-env:latest \
    --target "yandex2mqtt" \
    --tag-latest \
    --push \
    --all \
    --from "homeassistant/{arch}-base" \
    --author "Dmitry Parkhonin <deps@yandex.ru>" \
    --doc-url "https://github.com/dparhonin/hassio-yandex2mqtt" \
    --parallel
