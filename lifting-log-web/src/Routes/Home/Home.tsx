import "./Home.css"
import { JSX, useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import { HTTPException, Workout } from "../../types";

const Home = (): JSX.Element => {
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
        <div className="route-container" id="home">
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
                            <p key={workout.id}>{workout.name}</p>
                        )))
                    }
                </>
                )
            }
        </div>
    );
}

export default Home;