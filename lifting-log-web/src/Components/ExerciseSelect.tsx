import "./ExerciseSelect.css";
import { Exercise, HTTPException } from "../types";
import { JSX, useEffect, useState } from "react";

type ExerciseElementProps = {
    exercise: Exercise,
    selectExercise: (ex: Exercise) => void
}

type ExerciseSelectProps = {
    exercises: Array<Exercise>,
    cancelSelect: () => void,
    selectExercise: (ex: Exercise) => void
}

const fetchExercises = async (serverUrl: string, token: string): Promise<Array<Exercise>> => {    
    const response: Response = await fetch(serverUrl+"/exercises/me/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer "+token
        }
    })

    const data: unknown = await response.json();

    if (response.ok) {
        const exercises: Array<Exercise> = data as Array<Exercise>;
        return exercises;
    }
    else {
        const httpException: HTTPException = data as HTTPException;
        throw new Error(httpException.detail);
    }
};

const ExerciseElement = ({ exercise, selectExercise }: ExerciseElementProps): JSX.Element => {
    return (
        <div
            className="es-exercise-container"
            onClick={() => selectExercise(exercise)}
        >
            <p>{exercise.name}</p>
            {exercise.primary_muscles && <p className="es-muscle-text">{exercise.primary_muscles}</p>}
        </div>
    );
}

const ExerciseSelect = ({ exercises, cancelSelect, selectExercise }: ExerciseSelectProps): JSX.Element => {
    const [search, setSearch] = useState<string>("");
    const [searchToLower, setSearchToLower] = useState<string>("");

    useEffect(() => {
        // scroll 
        const esContainer: HTMLElement | null = document.getElementById("es-container");
        if (esContainer !== null) {
            esContainer.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    }, []);

    useEffect(() => {
        setSearchToLower(search.toLowerCase());
    }, [search]);

    return (
    <div className="route-container" id="es-container">
        <div className="es-options">
            <button
                className="es-options-button"
                onClick={cancelSelect}
            >
                Cancel
            </button>
            <p className="es-options-text">Exercise Select</p>
            <button
                className="es-options-button"
                onClick={() => console.log("Create Exercise")}
            >
                Create
            </button>
        </div>
        <input 
            type="text"
            className="es-search-bar"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <div className="es-exercises-container">
            {
                exercises
                .filter((exercise) => 
                    exercise.name.toLowerCase().includes(searchToLower)
                )
                .map((exercise) => (
                    <ExerciseElement 
                        key={exercise.id}
                        exercise={exercise}
                        selectExercise={selectExercise}
                    />
                ))
            }
        </div>
    </div>
    );
};

export { ExerciseSelect, fetchExercises };