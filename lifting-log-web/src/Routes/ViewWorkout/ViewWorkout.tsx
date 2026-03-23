import { JSX, useEffect, useState } from "react"
import "./ViewWorkout.css"
import { useNavigate, NavigateFunction } from "react-router";
import { Workout } from "../../types";

const ViewWorkout = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate: NavigateFunction = useNavigate();
    const [workout, setWorkout] = useState<Workout>({} as Workout);

    useEffect(() => {
        const workoutToViewString: string | null = localStorage.getItem("workoutToView");
        if (!workoutToViewString) {
            navigate("/");
            return;
        }

        const workoutToView: Workout = JSON.parse(workoutToViewString) as Workout;
        setWorkout(workoutToView);
        setIsLoading(false);
    }, []);

    return (
        <div className="route-container">
            {
                isLoading ? (
                    <div>Loading...</div>
                ) : (
                <>
                    <button
                        onClick={() => navigate("/")}
                    >
                        Back
                    </button>
                    <p>{workout.name}</p>
                </>
                )
            }
        </div>
    )
}

export default ViewWorkout;