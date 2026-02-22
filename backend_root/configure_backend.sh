#!/bin/bash

echo "Checking for secret key..."
if [ ! -f ./backend/.env ];
then
	echo "No secret key found, generating new one..."
	echo "SECRET_KEY=$(openssl rand -hex 32)" > ./backend/.env
else
	echo "Secret key found!"
fi

echo "Checking for database..."
if [ ! -f ./backend/database/lifting_log.db ];
then
	echo "No database found, generating new one..."
	python3 -m backend.database.tables
else
	echo "Database found!"
fi

echo "Configuration complete, starting app"
exec "$@"
