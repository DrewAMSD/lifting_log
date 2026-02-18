import "./WorkoutPage.css";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { HTTPException } from "../types";

type SetTemplate = {
    reps?: number
    rep_range_start?: number
    rep_range_end?: number
    time_range_start?: number
    time_range_end?: number
}

type ExerciseTemplate = {
    exercise_id: number
    exercise_name: string
    routine_note: string
    set_templates: Array<SetTemplate>
}

type WorkoutTemplate = {
    id: number,
    name: string,
    username: string,
    exercise_templates: Array<ExerciseTemplate>
}

const WorkoutPage = () => {
    const { serverUrl, user } = useAuth();
    const [workoutTemplates, setWorkoutTemplates] = useState<Array<WorkoutTemplate>>([]);
    
    useEffect(() => {
        const fetchWorkoutTemplates = async (): Promise<void> => {
            if (user === null) {
                return;
            }
            try {
                const response: Response = await fetch(serverUrl+"/templates/me/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "/application/json",
                        "Authorization": "Bearer "+user.access_token.token
                    },
                });

                if (response.ok) {
                    const templates: Array<WorkoutTemplate> = await response.json() as Array<WorkoutTemplate>;
                    setWorkoutTemplates(templates);
                }
                else {
                    const httpException: HTTPException = await response.json() as HTTPException;
                    throw new Error(httpException.detail);
                }
            }
            catch (error) {
                console.error("Error: ", error)
            }
        }

        fetchWorkoutTemplates();
    }, []);

    useEffect(() => {console.log(workoutTemplates)}, [workoutTemplates]);

    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="workout-page">
            Workout Page
            {!workoutTemplates.length ? (
                <div>Uh Oh... Looks like you have no templates! Hit create template to make one.</div>
            ) : (
                <div>Workout Templates found</div>
            )}
        </div>
    );
}

export default WorkoutPage;