import "./WorkoutPage.css";
import React, { JSX, useState, useEffect, useId } from "react";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { HTTPException, WorkoutTemplate } from "../types";

const WorkoutPage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
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
                setIsLoading(false);
            }
        };
        fetchWorkoutTemplates();
    }, []);

    return (
        <div className="route-container">
            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <header className="workout-header">Workout</header>
                    <button 
                        className="workout-page-button"
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            navigate("/workout/working-out");
                        }}
                    >
                        Start Empty Workout
                    </button>
                    <p className="workout-templates">Workout Templates</p>
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
                                    onClick={() => {
                                        localStorage.setItem("templateToEdit", JSON.stringify(workoutTemplate))
                                        navigate("/workout/edit-template");
                                    }}
                                >
                                    <div className="template-header">
                                        <p className="template-name">{workoutTemplate.name}</p>
                                    </div>
                                    <div 
                                        className="template-exercise"
                                    >
                                        {workoutTemplate.exercise_templates.map((exerciseTemplate, exIdx) => (
                                            <div 
                                                className="template-exercise-text"
                                                key={exIdx}
                                            >
                                                - {exerciseTemplate.exercise_name}
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        className="template-button"
                                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                            event.stopPropagation();
                                            localStorage.setItem("templateToUse", JSON.stringify(workoutTemplate));
                                            navigate("/workout/working-out");
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
            )}
        </div>
    );
}

export default WorkoutPage;