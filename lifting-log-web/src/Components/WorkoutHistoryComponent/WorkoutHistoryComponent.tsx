import "./WorkoutHistoryComponent.css"
import { JSX, useState, useEffect } from "react"
import { useAuth } from "../../AuthProvider";
import { Workout, HTTPException } from "../../types";
import WorkoutPreview from "../WorkoutPreview/WorkoutPreview";

const WorkoutHistoryComponent = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const [workouts, setWorkouts] = useState<Array<Workout>>([]);

    useEffect(() => {
        const fetchWorkouts = async(): Promise<void> => {
            try {
                const token: string = await getToken();

                const response: Response = await fetch(serverUrl+"/workouts/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer "+token
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    const workoutsPayload: Array<Workout> = data as Array<Workout>;
                    setWorkouts(workoutsPayload);
                } else {
                    const httpException: HTTPException = data as HTTPException;

                    setMessage("Failed to fetch workouts");
                    console.error(httpException.detail);
                }
            }
            catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();
    }, []);

    return (
    <div id="wh-container">
        {
            isLoading ? (
                <div>Loading...</div>
            ) : (
            <>
                {message && <p>{message}</p>}
                {
                    workouts.length === 0 ? (
                    <>
                        <p>No Workouts on Record</p>
                        <p>Go to the Workout Tab to get Started</p>
                    </>
                    ) : (
                    workouts.map(workout => (
                        <WorkoutPreview 
                            key={workout.id} 
                            workout={workout}
                        />
                    )))
                }
            </>
            )
        }
    </div>
    )
}

export default WorkoutHistoryComponent;