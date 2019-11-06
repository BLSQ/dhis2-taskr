#!/usr/bin/env bash
export APP=dhis2-taskr
yarn build --development
rm $APP.zip || true
cd ./build && rm ./static/js/*.js.map && zip -r ../$APP.zip . && cd ..