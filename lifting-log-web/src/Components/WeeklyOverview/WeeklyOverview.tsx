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

                const response: Response = await fetch(serverUrl+"/workouts/me/stats/this-week", {
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
                <div>{workoutStats.workout_count}</div>
            )
        }
    </>
    )
};

export default WeeklyOverview;