echo \"REACT_APP_SERVER_URL='http://$(hostname -I | cut -f1 -d' ' | xargs):8000'\" > ./.env

npm run start