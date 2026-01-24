from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.routers import muscles, users, exercises, workouts

app = FastAPI()

app.include_router(users.router)
app.include_router(exercises.router)
app.include_router(muscles.router)
app.include_router(workouts.router)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.81:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_message():
    return {"message": "Hello World!"}


@app.get("/favicon.ico")
def root_icon():
    return FileResponse("./favicon.ico")