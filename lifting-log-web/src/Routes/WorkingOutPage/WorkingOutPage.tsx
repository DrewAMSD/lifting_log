import { JSX, useState, useEffect } from "react";
import "./WorkingOutPage.css";
import { useAuth } from "../../AuthProvider";
import { WorkoutTemplate, Workout, ExerciseEntry, SetEntry, Exercise, HTTPException } from "../../types";
import { NavigateFunction, useNavigate } from "react-router";
import { ExerciseSelect, FetchExercises } from "../../Components/ExerciseSelect/ExerciseSelect";
import ExerciseEntryComponent from "../../Components/ExerciseEntryComponent/ExerciseEntryComponent";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

const getDuration = (startTime: number): string => {
    const currentTime: number = Math.floor(Date.now() / 1000); // in seconds
    const durationInSeconds: number = currentTime - startTime;
    const hours: number = Math.floor(durationInSeconds / 3600);
    const minutes: number = Math.floor(durationInSeconds / 60) % 60;
    const seconds: number = durationInSeconds % 60;
    const durationString: string =
        hours.toString().padStart(2, "0")+
        ":"+
        minutes.toString().padStart(2, "0")+
        ":"+
        seconds.toString().padStart(2, "0")
    ;
    return durationString;
}

const WorkingOutPage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // exercise fields
    const [isSelectingExercise, setIsSelectingExercise] = useState<boolean>(false);
    const [exercises, setExercises] = useState<Array<Exercise>>([]);
    // time fields
    const [startTime, setStartTime] = useState<number>(0);
    // workout state
    const [workoutState, setWorkoutState] = useState<Workout>({} as Workout);

    const updateExerciseEntry = (exIdx: number, newExerciseEntry: ExerciseEntry): void => {
        setWorkoutState(prevWorkoutState => ({
            ...prevWorkoutState,
            exercise_entries: prevWorkoutState.exercise_entries.map((prevExerciseEntry, i) => (
                i === exIdx ? {
                    ...prevExerciseEntry,
                    description: newExerciseEntry.description,
                    set_entries: newExerciseEntry.set_entries.map(newSetEntry => ({
                        ...newSetEntry
                    }))
                } :
                prevExerciseEntry
            ))
        }));
    };

    const deleteExerciseEntry = (exIdx: number): void => {
        const newExerciseEntries: Array<ExerciseEntry> = workoutState.exercise_entries;
        newExerciseEntries.splice(exIdx, 1);
        setWorkoutState(prevWorkoutState => ({
            ...prevWorkoutState,
            exercise_entries: newExerciseEntries
        }));
    };

    const updateSetEntry = (exIdx: number, setIdx: number, newSetEntry: SetEntry): void => {
        setWorkoutState(prevWorkoutState => ({
            ...prevWorkoutState,
            exercise_entries: prevWorkoutState.exercise_entries.map((prevExerciseEntry, i) => (
                i === exIdx ? {
                    ...prevExerciseEntry,
                    set_entries: prevExerciseEntry.set_entries.map((prevSetEntry, j) => (
                        j === setIdx ? {
                            ...prevSetEntry,
                            previous: newSetEntry.previous,
                            weight: newSetEntry.weight,
                            reps: newSetEntry.reps,
                            time: newSetEntry.time,
                            placeholder: newSetEntry.placeholder,
                            submitted: newSetEntry.submitted
                        } :
                        prevSetEntry
                    ))
                } :
                prevExerciseEntry
            ))
        }));
    };

    const submitWorkout = async (): Promise<void> => {
        if (isSubmitting && workoutState.name.length == 0) {
            setMessage("Please Name Your Workout");
            return;
        }

        // keep only sets that were submitted in workout
        const exerciseEntriesToSubmit: Array<ExerciseEntry> = [];
        for (const exerciseEntry of workoutState.exercise_entries) {
            const setEntriesToSubmit: Array<SetEntry> = [];
            for (const setEntry of exerciseEntry.set_entries) {
                if (setEntry.submitted) {
                    setEntriesToSubmit.push(setEntry);
                }
            }
            if (setEntriesToSubmit.length > 0) {
                exerciseEntriesToSubmit.push({
                    ...exerciseEntry,
                    set_entries: setEntriesToSubmit
                })
            }
        }
        if (!isSubmitting && exerciseEntriesToSubmit.length == 0) {
            setMessage("You must complete a set to submit a workout");
            return;
        }
        if (!isSubmitting) {
            setMessage("");
            setIsSubmitting(true);
            return;
        }

        const workoutToSubmit: Workout = {
            ...workoutState,
            exercise_entries: exerciseEntriesToSubmit
        }

        try {
            const token: string = await getToken();

            const fetchUrl: string = serverUrl+"/workouts/me";
            const fetchRequest = {
                method: (workoutState.id !== undefined ? "PUT" : "POST"),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+token
                },
                body: JSON.stringify(workoutToSubmit)
            };

            const response = await fetch(fetchUrl, fetchRequest);

            if (response.ok) {
                //  change this later (navigate to workout view)
                setMessage("success");
            } else {
                const httpException: HTTPException = await response.json() as HTTPException;
                setMessage(httpException.detail);
            }
        }
        catch (error: unknown) {
            console.error("Error: "+error);
        }
    };

    const getExerciseByName = (exerciseName: string): Exercise => {
        let l: number = 0;
        let r: number = exercises.length-1;
        let m: number;
        while (l <= r) {
            m = Math.floor((l + r) / 2);
            if (exercises[m].name === exerciseName) {
                return exercises[m];
            }
            else if (exercises[m].name.localeCompare(exerciseName) > 0) {
                r = m-1;
            }
            else {
                l = m+1;
            }
        }

        // throw new Error("Exercise for id: "+id+" does not exist");
        return {
            id: -1,
            name: "Exercise not found",
            primary_muscles: [],
            weight: false,
            reps: false,
            time: false
        } as Exercise;
    };

    const cancelSelect = (): void => {
        setIsSelectingExercise(false);
    };

    const selectExercise = (ex: Exercise): void => {
        const newExerciseEntries: Array<ExerciseEntry> = [...workoutState.exercise_entries];
        const newExerciseEntry: ExerciseEntry = {
            exercise_id: ex.id,
            exercise_name: ex.name,
            description: "",
            routine_note: "",
            set_entries: [{} as SetEntry]
        } as ExerciseEntry;

        newExerciseEntries.push(newExerciseEntry);

        setWorkoutState((prevWorkoutState) => ({
            ...prevWorkoutState,
            exercise_entries: newExerciseEntries
        }));
        setIsSelectingExercise(false);
    };

    const saveWorkoutLocally = async () => {
        localStorage.setItem("workoutState", JSON.stringify(workoutState));
    };

    useEffect(() => {
        if (!isLoading) {
            saveWorkoutLocally();
        }
    }, [isLoading, workoutState]);

    useEffect(() => {
        if (!isLoading && startTime !== 0) {
            const intervalId = setInterval(() => {
                setWorkoutState(prev => ({
                    ...prev,
                    duration: getDuration(startTime)
                }));
            }, 1000);

            return () => clearInterval(intervalId);
        }
    }, [isLoading, startTime]);

    useEffect(() => {
        // get initial workout state
        const workoutStateString: string | null = localStorage.getItem("workoutState");

        if (workoutStateString) { // locally saved workout to use
            const currentWorkoutState: Workout = JSON.parse(workoutStateString) as Workout;
            
            const currentTime: number = Math.floor(Date.now() / 1000); // seconds
            const newStartTime: number = currentTime - (
                (parseInt(currentWorkoutState.duration.substring(0, 2)) * 3600) +
                (parseInt(currentWorkoutState.duration.substring(3, 5)) * 60) +
                (parseInt(currentWorkoutState.duration.substring(6, 8)))
            );
            setStartTime(newStartTime);
            setWorkoutState(currentWorkoutState);
        }
        else { // need to create new workout
            const currentDate: Date = new Date();
            const newStartTime: number = Math.floor(currentDate.getTime() / 1000);
            setStartTime(newStartTime); // seconds
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
                    duration: "00:00:00",
                    exercise_entries: workoutTemplateToUse.exercise_templates.map((exerciseTemplate) => {             
                        const exerciseEntry: ExerciseEntry = {
                            exercise_id: exerciseTemplate.exercise_id,
                            exercise_name: exerciseTemplate.exercise_name,
                            description: "",
                            routine_note: exerciseTemplate.routine_note,
                            set_entries: exerciseTemplate.set_templates.map((setTemplate) => {
                                const exercise: Exercise = getExerciseByName(exerciseTemplate.exercise_name);
                                const isReps: boolean = exercise.reps && !exercise.weight;
                                const isRepRange: boolean = exercise.reps && exercise.weight;
                                const isTime: boolean = exercise.time;
                                
                                const setEntry: SetEntry = {
                                    // todo later: get previous exercises
                                    previous: "",
                                    placeholder: ""
                                };
                                if (isReps) {
                                    setEntry.placeholder = setTemplate.reps ? setTemplate.reps.toString() : "";
                                }
                                else if (isRepRange) {
                                    setEntry.placeholder = (setTemplate.rep_range_start !== undefined && setTemplate.rep_range_end !== undefined) ? (setTemplate.rep_range_start.toString()+"-"+setTemplate.rep_range_end.toString()) : "";
                                }
                                else if (isTime) {
                                    setEntry.placeholder = setTemplate.time ? setTemplate.time : "";
                                }
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
                    date: dateInteger,
                    start_time: currentTime,
                    duration: "00:00:00",
                    exercise_entries: []
                };
                setWorkoutState(emptyWorkout);
            }
        }

        const callFetchExercises = async () => {
            try {
                const token: string = await getToken();

                const exercisesToAdd: Array<Exercise> = await FetchExercises(serverUrl, token);
                // sort exercises alphabetically
                exercisesToAdd.sort((a,b) => a.name.localeCompare(b.name));
                setExercises(exercisesToAdd);
            }
            catch (error) {
                console.error("Error: ", error);
            }
            finally {
                setIsLoading(false);
            }
        }
        callFetchExercises();
    }, []);

    return (
        <div className="route-container">
            {
                isLoading ? (
                    <div>Loading...</div>
                ) : (
                isSelectingExercise ? (
                    <ExerciseSelect 
                        exercises={exercises}
                        cancelSelect={cancelSelect}
                        selectExercise={selectExercise}
                    />
                ) : (
                isSubmitting ? (
                    <div className="workout-submit-container">
                        <div>
                            <input 
                                type="text"
                                className="input-default wo-name"
                                value={workoutState.name}
                                placeholder={"Name Workout"}
                                maxLength={50}
                                onChange={(e) => {
                                    setWorkoutState(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }))
                                }}
                            />
                            <hr className="line line-light "/>
                        </div>
                        {message &&
                            <p className="error-message">{message}</p>
                        }
                        <textarea
                            className="input-default workout-description"
                            value={workoutState.description}
                            placeholder="description" // potential: get previous time this exercise was done and put as placeholder here
                            onChange={(e) => {
                                setWorkoutState(prevWorkoutState => ({
                                    ...prevWorkoutState,
                                    description: e.target.value
                                }));
                            }}
                            maxLength={512}
                        />
                        <div className="workout-submit-buttons-container">
                            <button
                                className="workout-cancel-submit-button"
                                onClick={() => {
                                    setIsSubmitting(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="workout-submit-button"
                                onClick={submitWorkout}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                ) : (
                <>
                    <div className="wo-options">
                        <button 
                            className="wo-options-button wo-delete-button"
                            onClick={() => {
                                localStorage.removeItem("workoutState");
                                localStorage.removeItem("templateToUse");
                                navigate("/workout");
                            }}
                        >
                            Discard
                        </button>
                        <p className="wo-options-text">Working Out</p>
                        <button 
                            className="wo-options-button"
                            onClick={submitWorkout}
                        >
                            Submit
                        </button>
                    </div>
                    <div className="wo-stats-container">
                        <div className="wo-stats-row">
                            <p className="wo-stats-text top-row">Duration</p>
                            <p className="wo-stats-text top-row">Exercises</p>
                            <p className="wo-stats-text top-row">Sets</p>
                            <p className="wo-stats-text top-row">Volume</p>
                        </div>
                        <div className="wo-stats-row">
                            <p className="wo-stats-text bottom-row blue-text">{workoutState.duration}</p>
                            <p className="wo-stats-text bottom-row">{workoutState.exercise_entries.reduce((sum, exerciseEntry) => sum + (exerciseEntry.set_entries[0].submitted ? 1 : 0), 0)}</p>
                            <p className="wo-stats-text bottom-row">{workoutState.exercise_entries.reduce((sum, exerciseEntry) => sum + exerciseEntry.set_entries.reduce((sets, setEntry) => sets + (setEntry.submitted ? 1 : 0), 0), 0)}</p>
                            <p className="wo-stats-text bottom-row">{workoutState.exercise_entries.reduce((sum, exerciseEntry) => sum + exerciseEntry.set_entries.reduce((volume, setEntry) => volume + ((setEntry.submitted && setEntry.reps !== undefined && setEntry.weight !== undefined) ? (setEntry.reps * setEntry.weight) : 0), 0), 0)} lbs</p>
                        </div>
                    </div>
                    <hr className="header-divider" />
                    {message &&
                        <p className="error-message">{message}</p>
                    }
                    {!workoutState.exercise_entries.length &&
                    <>

                        <p>No Exercises?</p>
                        <p>Click 'Add Exercise' to Get Started</p>
                    </>
                    }
                    <DragDropContext
                        onDragEnd={result => {
                            const { destination, source, draggableId } = result;

                            // User dropped item outside of droppable
                            if (!destination) {
                                return;
                            }

                            // User droppped item back into same droppable at same position
                            if (
                                destination.droppableId === source.droppableId &&
                                destination.index === source.index
                            ) {
                                return;
                            }

                            setWorkoutState((prevWorkoutState) => {
                                const newExerciseEntries: Array<ExerciseEntry> = [...prevWorkoutState.exercise_entries];
                                const exerciseEntryToMove: ExerciseEntry = newExerciseEntries[source.index];
                                newExerciseEntries.splice(source.index, 1);
                                newExerciseEntries.splice(destination.index, 0, exerciseEntryToMove);

                                return {
                                    ...prevWorkoutState,
                                    exercise_entries: newExerciseEntries
                                };
                            });
                        }}
                    >
                        <Droppable droppableId="exercise-entry-droppable">
                            {provided => (
                                <div 
                                    className="wo-exercise-entries-container"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                {
                                    workoutState.exercise_entries.map((exerciseEntry, exIdx) => (
                                        <ExerciseEntryComponent 
                                            key={exIdx}
                                            exIdx={exIdx}
                                            exerciseEntry={exerciseEntry}
                                            exercise={getExerciseByName(exerciseEntry.exercise_name)}
                                            updateExerciseEntry={updateExerciseEntry}
                                            deleteExerciseEntry={deleteExerciseEntry}
                                            updateSetEntry={updateSetEntry}
                                        />
                                    ))
                                }
                                {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    <button 
                        className="wo-add-exercise-button"
                        onClick={() => {
                            setIsSelectingExercise(true)
                        }}
                    >
                        Add Exercise
                    </button>
                </>
                )))
            }
        </div>
    )
};

export default WorkingOutPage;