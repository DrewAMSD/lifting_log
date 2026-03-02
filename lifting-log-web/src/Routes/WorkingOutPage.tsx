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

type SetEntry = {
    previous?: string
    weight?: number
    reps?: number
    time?: string
    placeholder?: string
}

type ExerciseEntry = {
    exercise_id: number
    exercise_name?: string
    description?: string
    routine_note?: string
    set_entries: Array<SetEntry>
}

type Workout = {
    id?: number
    name: string
    description?: string
    date: number
    start_time: string
    duration: string
    stats?: WorkoutStats
    exercise_entries: Array<ExerciseEntry>
}

const WorkingOutPage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutState, setWorkoutState] = useState<Workout>({} as Workout);

    // TODO: add exercise select with fetch exercises on initial page redirect
    useEffect(() => {
        const workoutStateString: string | null = localStorage.getItem("workoutState");

        if (workoutStateString) {
            const currentWorkoutState: Workout = JSON.parse(workoutStateString) as Workout;
            setWorkoutState(currentWorkoutState);
        }
        else {
            const currentDate: Date = new Date();
            const hours: number = currentDate.getHours();
            const minutes: number = currentDate.getMinutes();
            const seconds: number = currentDate.getSeconds();
            const currentTime: string = hours.toString().padStart(2, "0")+":"+minutes.toString().padStart(2, "0")+":"+seconds.toString().padStart(2, "0");

            const workoutTemplateString: string | null = localStorage.getItem("templateToUse");
            if (workoutTemplateString) {
                const workoutTemplateToUse: WorkoutTemplate = JSON.parse(workoutTemplateString) as WorkoutTemplate;
                
                const workoutStateFromTemplate: Workout = {
                    name: workoutTemplateToUse.name,
                    date: currentDate.getFullYear(),
                    start_time: currentTime,
                    duration: "",
                    exercise_entries: workoutTemplateToUse.exercise_templates.map((exerciseTemplate) => {             
                        const exerciseEntry: ExerciseEntry = {
                            exercise_id: exerciseTemplate.exercise_id,
                            exercise_name: exerciseTemplate.exercise_name,
                            description: "",
                            routine_note: exerciseTemplate.routine_note,
                            set_entries: exerciseTemplate.set_templates.map((setTemplate) => {
                                // const isReps: boolean = exercise.reps && !exercise.weight;
                                // const isRepRange: boolean = exercise.reps && exercise.weight;
                                // const isTime: boolean = exercise.time;
                                
                                const setEntry: SetEntry = {
                                    // TODO: update fields after implementing exercise fetch + grabbing previous exercises
                                    previous: "",
                                    placeholder: ""
                                };
                                // if (isReps) {
                                //     setEntry.placeholder = setTemplate.reps ? setTemplate.reps.toString() : "";
                                // }
                                // else if (isRepRange) {
                                //     setEntry.placeholder = (setTemplate.rep_range_start !== undefined && setTemplate.rep_range_end !== undefined) ? (setTemplate.rep_range_start.toString()+"-"+setTemplate.rep_range_end.toString()) : "";
                                // }
                                // else if (isTime) {
                                //     setEntry.placeholder = setTemplate.time ? setTemplate.time : "";
                                // }
                                return setEntry;
                            })
                        }
                        return exerciseEntry;
                    })
                }
                setWorkoutState(workoutStateFromTemplate);
            } else {
                const emptyWorkout: Workout = {
                    name: "",
                    date: currentDate.getFullYear(),
                    start_time: currentTime,
                    duration: "",
                    exercise_entries: []
                };
                setWorkoutState(emptyWorkout);
            }
        }

        setIsLoading(false);
    }, []);

    // TODO: add button for discard workout where it clears templateToUse and workoutState in localStorage
    return (
        <div className="route-container">
            {
                isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <p>
                        Working out
                    </p>
                )
            }
        </div>
    )
};

export default WorkingOutPage;