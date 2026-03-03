import { JSX, useState, useEffect } from "react";
import "./WorkingOutPage.css";
import { useAuth } from "../../AuthProvider";
import { WorkoutTemplate, Workout, ExerciseEntry, SetEntry } from "../../types";
import { NavigateFunction, useNavigate } from "react-router";

const WorkingOutPage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutState, setWorkoutState] = useState<Workout>({} as Workout);

    const saveWorkoutLocally = async () => {
        localStorage.setItem("workoutState", JSON.stringify(workoutState));
    };

    useEffect(() => {
        if (!isLoading) {
            saveWorkoutLocally();
        }
    }, [workoutState]);

    // TODO: add exercise select with fetch exercises on initial page redirect
    useEffect(() => {
        const workoutStateString: string | null = localStorage.getItem("workoutState");

        if (workoutStateString) { // locally saved workout to use
            const currentWorkoutState: Workout = JSON.parse(workoutStateString) as Workout;
            setWorkoutState(currentWorkoutState);
        }
        else { // need to create new workout
            const currentDate: Date = new Date();
            // current date as int
            const year: number = currentDate.getFullYear();
            const month: number = currentDate.getMonth() + 1;
            const day: number = currentDate.getDay() + 1;
            const dateInteger: number = (year * 10000) + (month * 100) + day;
            // current time
            const hours: number = currentDate.getHours();
            const minutes: number = currentDate.getMinutes();
            const seconds: number = currentDate.getSeconds();
            const currentTime: string = hours.toString().padStart(2, "0")+":"+minutes.toString().padStart(2, "0")+":"+seconds.toString().padStart(2, "0");

            const workoutTemplateString: string | null = localStorage.getItem("templateToUse");
            if (workoutTemplateString) {
                const workoutTemplateToUse: WorkoutTemplate = JSON.parse(workoutTemplateString) as WorkoutTemplate;
                
                const workoutStateFromTemplate: Workout = {
                    name: workoutTemplateToUse.name,
                    date: dateInteger,
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
                <>
                    <div className="wo-options">
                        <button 
                            className="wo-options-button wo-delete-button"
                            onClick={() => {
                                localStorage.removeItem("workoutState");
                                navigate("/workout");
                            }}
                        >
                            Discard
                        </button>
                        <p className="wo-options-text">Working Out</p>
                        <button 
                            className="wo-options-button"
                            onClick={() => console.log("Submit workout")}
                        >
                            Submit
                        </button>
                    </div>
                    <p>
                        Working out page here
                    </p>
                </>
                )
            }
        </div>
    )
};

export default WorkingOutPage;