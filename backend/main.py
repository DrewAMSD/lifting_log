from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from models import *

app = FastAPI()

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
def root_message() -> dict:
    return {"message": "Hello World!"}

@app.get("/favicon.ico")
def root_icon() -> FileResponse:
    return FileResponse("./favicon.ico")

@app.get("/exercise", response_model=Exercise)
def get_exercise() -> Exercise:
    return {
        "name": "Incline Bench Press(Barbell)",
        "default": True,
        "primary": ["chest"],
        "secondary": ["triceps", "shoulders"],
        "weight": True,
        "reps": True
    }
