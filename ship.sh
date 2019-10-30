#!/usr/bin/env bash
if [[ $# -eq 0 ]] ; then
    echo 'password required'
    exit 0
fi
export DHIS2HOST=$1
export DHIS2PASSWORD=$3
export DHIS2USER=$2
export APP=dhis2-taskr
yarn build --development
rm $APP.zip || true
cd ./build && rm ./static/js/*.js.map && zip -r ../$APP.zip . && cd ..
curl -vvv -H "Accept: application/json" -X POST -u $DHIS2USER:$DHIS2PASSWORD  --compressed -F file=@$APP.zip $DHIS2HOST/api/apps
curl -X GET -u $DHIS2USER:$DHIS2PASSWORD -H "Accept: application/json" $DHIS2HOST/api/apps | jq
curl -X PUT -u $DHIS2USER:$DHIS2PASSWORD -H "Accept: application/json" $DHIS2HOST/api/apps | jq
curl -X GET -u $DHIS2USER:$DHIS2PASSWORD -H "Accept: application/json" $DHIS2HOST/api/apps | jq
