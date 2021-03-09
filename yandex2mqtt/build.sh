#!/bin/bash
# Run this script to build a sample Docker image of the plugin
# you can then start it and check the contents by typing:
#  docker run -it deps.y2m-addon /bin/bash
docker build -t deps.y2m-addon --no-cache=false .