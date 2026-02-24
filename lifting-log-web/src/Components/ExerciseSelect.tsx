import "./ExerciseSelect.css";
import { Exercise, HTTPException } from "../types";


type ExerciseSelectProps = {
    exercises: Array<Exercise>,
    cancelSelect: () => void
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

const ExerciseSelect = ({ exercises, cancelSelect }: ExerciseSelectProps) => {

    return (
    <>
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
    </>
    );
};

export { ExerciseSelect, fetchExercises };