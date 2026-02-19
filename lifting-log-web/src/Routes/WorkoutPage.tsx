import "./WorkoutPage.css";
import { useState, useEffect, ReactNode } from "react";
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
    const [workingOut, setWorkingOut] = useState<boolean>(false);

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

    if (user === null) {
        return <Navigate to="/login" />
    }

    const DefaultPage = () => {
        return (
            <>
                <header className="workout-header">Workout</header>
                <button className="workout-page-button">Start Empty Workout</button>
                <button className="workout-page-button">Create New Workout Template</button>
                <p className="workout-text">My Workout Templates:</p>
                <div className="templates">
                    {!workoutTemplates.length ? (
                        <div>Uh oh... Looks like you have no templates! Hit create template to make one.</div>
                    ) : (
                        <>
                        {workoutTemplates.map((workoutTemplate) => (
                            <div
                            key={workoutTemplate.id}
                            className="template"
                            >
                                <p>{workoutTemplate.name}</p>
                                <div className="template-exercise">
                                    {workoutTemplate.exercise_templates.map((exerciseTemplate) => (
                                        <div 
                                        className="template-exercise-text"
                                        key={exerciseTemplate.exercise_id}
                                        >
                                            - {exerciseTemplate.exercise_name}
                                        </div>
                                    ))}
                                </div>
                                <button>Edit Template</button>
                                <button>Start Workout</button>
                            </div>
                        ))}
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="workout-page">
            {workingOut ? (
            <>
                {/* replace here with working out page, need to also have a third editing template page */}
            </>
            ) : (
                <DefaultPage />
            )}
        </div>
    );
}

export default WorkoutPage;