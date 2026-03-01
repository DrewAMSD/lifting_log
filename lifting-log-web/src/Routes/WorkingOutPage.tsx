import { JSX, useState, useEffect } from "react";
import "./WorkingOutPage.css";
import { useAuth } from "../AuthProvider";
import { WorkoutTemplate } from "../types";

type WorkoutStats = {
    exercise_count: number
    sets: number
    reps: number
    volume: number
    distributions: {
        set_distribution: Record<string, Record<string, number>>,
        muscle_distribution: Record<string, number>
    }
}

type Set_Entry = {
    weight?: number
    reps?: number
    time?: string
}

type Exercise_Entry = {
    exercise_id: number
    exercise_name?: string
    description?: string
    set_entries: Array<Set_Entry>
}

type Workout = {
    id?: number
    name: string
    description?: string
    date: number
    start_time: string
    duration: string
    stats?: WorkoutStats
    exercise_entries: Array<Exercise_Entry>
}

const WorkingOutPage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutState, setWorkoutState] = useState<Workout>({} as Workout);

    useEffect(() => {
        const workoutStateString: string | null = localStorage.getItem("workoutState");
        if (workoutStateString) {
            const currentWorkoutState: Workout = JSON.parse(workoutStateString) as Workout;
            setWorkoutState(currentWorkoutState);
        }
        else {
            const workoutTemplateString: string | null = localStorage.getItem("templateToUse");
            if (workoutTemplateString) {
                const workoutTemplateToUse: WorkoutTemplate = JSON.parse(workoutTemplateString) as WorkoutTemplate;
                // TODO: convert template into new workout object
            } else {
                const currentDate: Date = new Date();
                const hours: number = currentDate.getHours();
                const minutes: number = currentDate.getMinutes();
                const seconds: number = currentDate.getSeconds();
                const currentTime: string = hours.toString().padStart(2, "0")+":"+minutes.toString().padStart(2, "0")+":"+seconds.toString().padStart(2, "0");
                const emptyWorkout: Workout = {
                    name: "",
                    date: currentDate.getFullYear(),
                    start_time: currentTime,
                    duration: "",
                    exercise_entries: []
                };
            }
        }

        setIsLoading(false);
    }, []);

    return (
        <div className="route-container">
            Working Out Page
        </div>
    )
};

export default WorkingOutPage;