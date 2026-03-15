#!/bin/bash

echo "Checking for secret key..."
if [ ! -f ./src/.env ];
then
	echo "No secret key found, generating new one..."
	echo "SECRET_KEY=$(openssl rand -hex 32)" > ./src/.env
else
	echo "Secret key found!"
fi

echo "Checking for database..."
if [ ! -f ./database/database.db ];
then
	echo "No database found, generating new one..."
	python3 -m backend.database
else
	echo "Database found!"
fi

echo "Configuration complete, starting app"
exec "$@"
