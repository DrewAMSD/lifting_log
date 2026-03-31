# Lifting Log

Web app to track workouts, create workout templates, and view workout statistics to stay on top of fitness goals.

## Running app locally

1. Clone the repository

```bash
# over https
git clone https://github.com/DrewAMSD/lifting_log.git
# over ssh
git clone git@github.com:DrewAMSD/lifting_log.git
```

2. Move into project root directory

```bash
cd lifting_log
```

3. Start backend with sqlite configuration

```bash
docker compose up

# Alternatively: cd into ./api and run docker file manually
```

Can interact with FastAPI endpoints on localhost:8000, or use localhost:8000/docs for a user interface.

4. Start web

```bash
# move into root directory of web app
cd lifting-log-web

# install project dependencies (must have Node installed)
npm install

# start web server locally
npm run dev
```

Can access web app by visiting localhost:3000 in a browser.
