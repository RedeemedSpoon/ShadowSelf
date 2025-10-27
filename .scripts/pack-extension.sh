#!/bin/bash

SHADOWSELF_PATH=$(dirname "$(dirname "$(realpath "$0")")")
EXTENSION_DIR="$SHADOWSELF_PATH/extension"
SLEEP_TIME=0.25

echo "Starting packaging of browser extensions..."
mv $EXTENSION_DIR/manifest-chrome.json $EXTENSION_DIR/manifest.json
mv $EXTENSION_DIR/manifest-firefox.json .
sleep $SLEEP_TIME

zip -r ShadowSelf-Chromium.zip $EXTENSION_DIR > /dev/null
echo "Chromium extension packaged as ShadowSelf-Chromium.zip"
sleep $SLEEP_TIME

mv $EXTENSION_DIR/manifest.json $EXTENSION_DIR/manifest-chrome.json
mv ./manifest-firefox.json $EXTENSION_DIR
sleep $SLEEP_TIME

echo "Preparing Firefox extension..."
mv $EXTENSION_DIR/manifest-firefox.json $EXTENSION_DIR/manifest.json
mv $EXTENSION_DIR/manifest-chrome.json .
sleep $SLEEP_TIME

zip -r ShadowSelf-Firefox.zip $EXTENSION_DIR > /dev/null
echo "Firefox extension packaged as ShadowSelf-Firefox.zip"
sleep $SLEEP_TIME

mv $EXTENSION_DIR/manifest.json $EXTENSION_DIR/manifest-firefox.json
mv ./manifest-chrome.json $EXTENSION_DIR
sleep $SLEEP_TIME

echo "Packaging complete!"
