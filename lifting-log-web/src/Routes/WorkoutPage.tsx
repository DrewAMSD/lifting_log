import "./WorkoutPage.css";
import React, { useState, useEffect } from "react";
import { Navigate, NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { HTTPException, WorkoutTemplate } from "../types";


const WorkoutPage = () => {
    const { serverUrl, user, getToken } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    // fields for working out
    const [workingOut, setWorkingOut] = useState<boolean>(false);
    // fields fields for workout templates
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
        const navigate: NavigateFunction = useNavigate();

        return (
        <>
            <header className="workout-header">Workout</header>
            <button 
            className="workout-page-button"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                console.log("Start Empty Workout");
            }}
            >
                Start Empty Workout
            </button>
            <p className="workout-text">Workout Templates</p>
            <button 
            className="workout-page-button"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                localStorage.removeItem("templateToEdit");
                navigate("/workout/edit-template");
            }}
            >
                Create New Workout Template
            </button>
            <div className="templates">
                {!workoutTemplates.length ? (
                    <p>Looks like you have no templates...</p>
                ) : (
                    <>
                    {workoutTemplates.map((workoutTemplate) => (
                        <div
                        key={workoutTemplate.id}
                        className="template"
                        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                            localStorage.setItem("templateToEdit", JSON.stringify(workoutTemplate))
                            navigate("/workout/edit-template");
                        }}
                        >
                            <p>{workoutTemplate.name}</p>
                            <div 
                            className="template-exercise"
                            >
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
                            <button 
                            className="template-button"
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                console.log("Start Workout with Template");
                            }}
                            >
                                Start Workout
                            </button>
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
                    <DefaultPage />
                )
            )}
        </div>
    );
}

export default WorkoutPage;