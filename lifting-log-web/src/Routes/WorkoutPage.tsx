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
    const { serverUrl, user, getToken } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [workingOut, setWorkingOut] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<boolean>(false);
    const [workoutTemplates, setWorkoutTemplates] = useState<Array<WorkoutTemplate>>([]);

    useEffect(() => {
        const fetchWorkoutTemplates = async (): Promise<void> => {
            try {
                const token: string = await getToken();
                const response: Response = await fetch(serverUrl+"/templates/me/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "/application/json",
                        "Authorization": "Bearer "+token
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
            finally {
                setLoading(false);
            }
        };
        fetchWorkoutTemplates();
    }, []);

    const DefaultPage = () => {
        return (
        <>
            <header className="workout-header">Workout</header>
            <button className="workout-page-button">Start Empty Workout</button>
            <p className="workout-text">Workout Templates</p>
            <button className="workout-page-button">Create New Workout Template</button>
            <div className="templates">
                {!workoutTemplates.length ? (
                    <p>Looks like you have no templates...</p>
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
                            {/* <button className="template-button">Edit Template</button> */}
                            <button className="template-button">Start Workout</button>
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
            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                workingOut ? (
                    <></>
                ) : (
                    editingTemplate ? (
                        <></>
                    ) : (
                        <DefaultPage />
                    )
                )
            )}
        </div>
    );
}

export default WorkoutPage;