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
                    console.log(workoutStatsPayload);
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
                <div>
                    {workoutStats.workout_count}
                    {workoutStats.reps}
                </div>
            )
        }
    </>
    )
};

export default WeeklyOverview;