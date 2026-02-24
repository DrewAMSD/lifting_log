import "./ExerciseSelect.css";
import { Exercise, HTTPException } from "../types";


type ExerciseSelectProps = {
    exercises: Array<Exercise>
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

const ExerciseSelect = ({ exercises }: ExerciseSelectProps) => {

    return (
        <div className="exercise-select-container">
            
        </div>
    );
};

export { ExerciseSelect, fetchExercises };