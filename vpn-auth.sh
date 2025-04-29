#!/bin/bash

DB_TEMP_USER="greed"
DB_TEMP_PASS="123456"

if [ "${username}" = "${DB_TEMP_USER}" ] && [ "${password}" = "${DB_TEMP_PASS}" ]; then
  exit 0
fi

exit 1
