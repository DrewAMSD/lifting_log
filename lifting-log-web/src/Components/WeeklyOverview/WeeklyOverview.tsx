import { JSX, useEffect, useState } from "react";
import "./WeeklyOverview.css";
import { useAuth } from "../../AuthProvider";
import { HTTPException, WorkoutStats } from "../../types";

const WeeklyOverview = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({} as WorkoutStats);

    useEffect(() => {
        const fetchWorkoutStats = async (): Promise<void> => {
            try {
                const token: string = await getToken();

                const date: Date = new Date();
                const dayOfWeek: number = (date.getDay() || 7) - 1; // 0 is for sunday -> 7, now we have 0 = Monday, ..., 6 = Sunday
                date.setHours(-24 * dayOfWeek);
                const year: number = date.getFullYear();
                const month: number = date.getMonth() + 1;
                const day: number = date.getDate();
                const dateInteger: number = (year * 10000) + (month * 100) + day;

                const response: Response = await fetch(serverUrl+"/workouts/me/stats?start_date="+dateInteger, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer "+token
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    const workoutStatsPayload: WorkoutStats = data as WorkoutStats;
                    setWorkoutStats(workoutStatsPayload);
                }
                else {
                    const httpException: HTTPException = data as HTTPException;
                    throw Error(httpException.detail);
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setIsLoading(false);
            }
        }

        fetchWorkoutStats();
    }, []);

    return (
    <>
        {
            isLoading ? (
                <div>Loading...</div>
            ) : (
            <div id="weekly-overview-container">
                <p id="weekly-overview-header">Weekly Overview:</p>

                <div id="weekly-overview-summary-container">
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Workouts</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.workout_count}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Exercises</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.exercise_count}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Sets</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.sets}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Reps</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.reps}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Volume</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.volume}</p>
                    </div>
                </div>

                <p>next</p>
            </div>
            )
        }
    </>
    )
};

export default WeeklyOverview;