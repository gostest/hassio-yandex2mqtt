#!/bin/bash
set -ev

if [ -z "${TRAVIS_TAG}" ]; then
    echo "Untagged build found. Testing building yandex2mqtt with tag 'test'."
    # build yandex2mqtt
    docker run -it --rm --privileged --name "${ADDON_NAME}" \
        -v ~/.docker:/root/.docker \
        -v "$(pwd)":/docker \
        hassioaddons/build-env:latest \
        --target "${ADDON_NAME}" \
        --tag-test \
        --all \
        --from "homeassistant/{arch}-base" \
        --author "Egor Osipov <gostest@gmail.com>" \
        --doc-url "${GITHUB_URL}" \
        --login "${DOCKER_USERNAME}" \
        --password "${DOCKER_PASSWORD}" \
        --parallel \
        --arg COMMIT "${TRAVIS_COMMIT}"
else
    echo "New git tagged build found. Testing building yandex2mqtt with tag 'latest'."
    docker run -it --rm --privileged --name "${ADDON_NAME}" \
        -v ~/.docker:/root/.docker \
        -v "$(pwd)":/docker \
        hassioaddons/build-env:latest \
        --target "${ADDON_NAME}" \
        --tag-latest \
        --all \
        --from "homeassistant/{arch}-base" \
        --author "Egor Osipov <gostest@gmail.com>" \
        --doc-url "${GITHUB_URL}" \
        --login "${DOCKER_USERNAME}" \
        --password "${DOCKER_PASSWORD}" \
        --parallel \
        --arg COMMIT "${TRAVIS_COMMIT}"
fi
echo "Local Docker build successful."
