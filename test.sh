#!/bin/sh

mocha_result=$(mocha)
SOURCE="failing"

if echo "$mocha_result" | grep -q "$SOURCE"; then
  echo "The testing failure!failure!failure!";
else
  echo "The testing pass";
fi