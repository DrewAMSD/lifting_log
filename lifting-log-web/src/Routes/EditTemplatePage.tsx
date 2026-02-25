import "./EditTemplatePage.css";
import React, { JSX, useEffect, useState } from "react";
import { WorkoutTemplate, ExerciseTemplate, SetTemplate, Exercise, Token, HTTPException } from "../types";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { ExerciseSelect, fetchExercises } from "../Components/ExerciseSelect";

type ExerciseTemplateProps = {
    exIdx: number,
    exerciseTemplate: ExerciseTemplate
    deleteExerciseTemplate: (exIdx: number) => void,
    updateExerciseTemplate: (exIdx: number, newExerciseTemplate: ExerciseTemplate) => void,
    exercise: Exercise
}

type SetTemplateProps = {
    setIdx: number,
    setTemplate: SetTemplate,
    isReps: boolean,
    isRepRange: boolean,
    isTime: boolean,
    deleteSetTemplate: (setIdx: number) => void,
    updateSetTemplate: (setIdx: number, newSetTemplate: SetTemplate) => void
}

const select0To59: Array<string> = Array.from({ length: 60}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));
const select0To23: Array<string> = Array.from({ length: 24}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));

const SetTemplateElement = ({ setIdx, setTemplate, isReps, isRepRange, isTime, deleteSetTemplate, updateSetTemplate }: SetTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [reps, setReps] = useState<string>(setTemplate.reps ? setTemplate.reps.toString() : "");
    const [repRangeStart, setRepRangeStart] = useState<string>(setTemplate.rep_range_start ? setTemplate.rep_range_start.toString() : "");
    const [repRangeEnd, setRepRangeEnd] = useState<string>(setTemplate.rep_range_end ? setTemplate.rep_range_end.toString() : "");
    // fields for time
    const time: string | undefined = setTemplate.time;
    const [hour, setHour] = useState<string>(time ? time.substring(0, 2) : "00");
    const [minute, setMinute] = useState<string>(time ? time.substring(3, 5) : "00");
    const [second, setSecond] = useState<string>(time ? time.substring(6, 8) : "00");

    const handleSetTemplateChange = (): void => {
        const newReps: number | undefined = isReps ? (!Number.isNaN(reps) ? parseInt(reps) : 0) : undefined;
        const newRepRangeStart: number | undefined = isRepRange ? (!Number.isNaN(repRangeStart) ? parseInt(repRangeStart) : 0) : undefined;
        const newRepRangeEnd: number | undefined = isRepRange ? (!Number.isNaN(repRangeEnd) ? parseInt(repRangeEnd) : 0) : undefined;
        const newTime: string | undefined = isTime ? (hour+":"+minute+":"+second) : undefined;

        const newSetTemplate: SetTemplate = {
            reps: newReps,
            rep_range_start: newRepRangeStart,
            rep_range_end: newRepRangeEnd,
            time: newTime
        }
        updateSetTemplate(setIdx, newSetTemplate);
    };

    useEffect(() => {
        if (!isLoading) {
            handleSetTemplateChange();
        }
    }, [reps, repRangeStart, repRangeEnd, hour, minute, second]);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    return (
        <div 
        className="edit-template-set-row">
            <p className="edit-template-set-row-item">{setIdx+1}</p>
            {isReps && 
            <input 
                type="text"
                inputMode="numeric"
                className="edit-template-set-row-item input-default" 
                value={reps}
                placeholder="0"
                onChange={(e) => setReps(e.target.value)}
            />}
            
            {isRepRange && 
            <p className="edit-template-set-row-item-rep-range">
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={repRangeStart}
                    placeholder="0"
                    onChange={(e) => setRepRangeStart(e.target.value)}
                />
                -
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={repRangeEnd}
                    placeholder="0"
                    onChange={(e) => setRepRangeEnd(e.target.value)}
                />
            </p>}
            {isTime && 
            <div 
                className="edit-template-set-row-item time-container"
            >
                <select defaultValue={hour} onChange={(e) => setHour(e.target.value)}>
                    {select0To23.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={minute} onChange={(e) => setMinute(e.target.value)}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={second} onChange={(e) => setSecond(e.target.value)}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
            </div>}
            <button 
                className="delete-button"
                onClick={() => deleteSetTemplate(setIdx)}
            >
                D
            </button>
        </div>
    );
}

const ExerciseTemplateElement = ({ exIdx, exerciseTemplate, deleteExerciseTemplate, updateExerciseTemplate, exercise }: ExerciseTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [routineNote, setRoutineNote] = useState<string>(exerciseTemplate.routine_note ? exerciseTemplate.routine_note : "");
    const isReps: boolean = exercise.reps && !exercise.weight;
    const isRepRange: boolean = exercise.reps && exercise.weight;
    const isTime: boolean = exercise.time;

    const updateRoutineNote = (): void => {
        const newExerciseTemplate = {
            ...exerciseTemplate,
            routine_note: routineNote
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    }

    const handleRoutineNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        event.target.style.height = "inherit";
        event.target.style.height = event.target.scrollHeight+"px";
        setRoutineNote(event.target.value);
    };

    const handleAddSet = (): void => {
        const newSetTemplates: Array<SetTemplate> = [...exerciseTemplate.set_templates];
        newSetTemplates.push({} as SetTemplate);
        const newExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    };

    const deleteSetTemplate = (setIdx: number): void => {
        if (exerciseTemplate.set_templates.length <= 1) {
            return;
        }

        const newSetTemplates: Array<SetTemplate> = [...exerciseTemplate.set_templates];
        newSetTemplates.splice(setIdx, 1);
        const newExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    };

    const updateSetTemplate = (setIdx: number, newSetTemplate: SetTemplate): void => {
        const newSetTemplates: Array<SetTemplate> = [...exerciseTemplate.set_templates];
        newSetTemplates[setIdx] = newSetTemplate;
        const newExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    };

    useEffect(() => {
        if (!isLoading) {
            updateRoutineNote();
        }
    }, [routineNote]);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    return (
        <div
        className="edit-template-exercise"
        >
            <div className="edit-template-exercise-header">
                <p className="edit-template-exercise-index">{exIdx+1}. </p>
                <p className="edit-template-exercise-name">{exerciseTemplate.exercise_name}</p>
                <button 
                    className="delete-button"
                    onClick={() => deleteExerciseTemplate(exIdx)}
                >
                    D
                </button>
            </div>
            <textarea
                className="input-default routine-note"
                placeholder="Routine Note"
                value={routineNote}
                onChange={handleRoutineNoteChange}
            />
            <hr className="line"/>
            <div className="edit-template-set">
                <div className="edit-template-set-row">
                    <p className="edit-template-set-row-item">Set</p>
                    {isReps && <p className="edit-template-set-row-item">Reps</p>}
                    {isRepRange && <p className="edit-template-set-row-item-rep-range">Rep Range</p>}
                    {isTime && <p className="edit-template-set-row-item">Time</p>}
                </div>
                <hr className="line line-light"/>
                {exerciseTemplate.set_templates.map((setTemplate, setIdx) => (
                    <SetTemplateElement 
                        key={setIdx} 
                        setIdx={setIdx} 
                        setTemplate={setTemplate} 
                        isReps={isReps} 
                        isRepRange={isRepRange} 
                        isTime={isTime}
                        deleteSetTemplate={deleteSetTemplate}
                        updateSetTemplate={updateSetTemplate}
                    />
                ))}
                <button 
                    className="add-set-button"
                    onClick={handleAddSet}
                >
                    Add Set
                </button>
            </div>
        </div>
    );
}

const EditTemplatePage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    // complete template state
    const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate>({name: "", exercise_templates: []} as WorkoutTemplate);
    // editable fields 
    const [workoutName, setWorkoutName] = useState<string>("");
    // exercise list
    const [exercises, setExercises] = useState<Array<Exercise>>([]);
    // conditional for deleting template
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    // variables for adding in exercise
    const [isSelectingExercise, setIsSelectingExercise] = useState<boolean>(false);

    const deleteExerciseTemplate = (exIdx: number): void => {
        if (exIdx < 0 || exIdx >= workoutTemplate.exercise_templates.length) {
            return;
        }
        const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
        newExerciseTemplates.splice(exIdx, 1);
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: newExerciseTemplates
        }));
    }

    const updateExerciseTemplate = (exIdx: number, newExerciseTemplate: ExerciseTemplate): void => {
        if (exIdx < 0 || exIdx >= workoutTemplate.exercise_templates.length) {
            return;
        }
        const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
        newExerciseTemplates[exIdx] = newExerciseTemplate;
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: newExerciseTemplates
        }));
    }

    // TODO: make a "addExerciseTemplate", will require drop down with all available exercises to choose from **does not need to be passed down to exercise template, button is in this element

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

    const saveWorkoutTemplate = async (): Promise<void> => {
        if (workoutTemplate.name.length <= 0) {
            setMessage("Workout template needs to be named");
            return;
        }
        if (workoutTemplate.exercise_templates.length <= 0) {
            setMessage("Workout template needs to have at least 1 exercise")
            return;
        }

        try {
            const token: string = await getToken();

            const fetchUrl: string = serverUrl+"/templates/me/"+(workoutTemplate.id !== undefined ? workoutTemplate.id : "");
            const fetchRequest = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+token
                },
                body: JSON.stringify(workoutTemplate)
            };
            if (workoutTemplate.id !== undefined) {
                fetchRequest.method = "PUT";
            }

            const response: Response = await fetch(fetchUrl, fetchRequest);

            if (response.ok) {
                localStorage.removeItem("templateToEdit");
                navigate("/workout")
            }
            else {
                const httpException: HTTPException = await response.json() as HTTPException;
                setMessage(httpException.detail);
            }
        }
        catch (error) {
            console.error("Error: ", error);
        }
    }

    const deleteWorkoutTemplate = async (): Promise<void> => {
        if (!workoutTemplate.id) {
            return;
        }
        try {
            const token: string = await getToken();

            const response: Response = await fetch(serverUrl+"/templates/me/"+workoutTemplate.id, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+token
                }
            })

            if (response.ok) {
                localStorage.removeItem("templateToEdit");
                navigate("/workout")
            }
            else {
                const httpException: HTTPException = await response.json() as HTTPException;
                throw new Error(httpException.detail);
            }
        }
        catch (error) {
            console.error("Error: ", error);
        }
    }

    const cancelSelect = (): void => {
        setIsSelectingExercise(false);
    }

    const selectExercise = (ex: Exercise): void => {
        const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
        const newExerciseTemplate: ExerciseTemplate = {
            exercise_id: ex.id,
            exercise_name: ex.name,
            routine_note: "",
            set_templates: [{} as SetTemplate]
        } as ExerciseTemplate;

        newExerciseTemplates.push(newExerciseTemplate);

        setWorkoutTemplate((prevWorkoutTemplate) => ({
            ...prevWorkoutTemplate,
            exercise_templates: newExerciseTemplates
        }));
        setIsSelectingExercise(false);
    }

    useEffect(() => {
        if (!isLoading) {
            setWorkoutTemplate((prevWorkoutTemplate) => ({
                ...prevWorkoutTemplate,
                name: workoutName
            }));
        }
    }, [workoutName]);

    useEffect(() => {
        const templateToEditString: string | null = localStorage.getItem("templateToEdit");
        if (templateToEditString) {
            const initTemplate: WorkoutTemplate = JSON.parse(templateToEditString) as WorkoutTemplate;
            setWorkoutTemplate(initTemplate);
            setWorkoutName(initTemplate.name);
        }
        
        const callFetchExercises = async () => {
            try {
                const token: string = await getToken();

                const exercisesToAdd: Array<Exercise> = await fetchExercises(serverUrl, token);
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
    <>
        {isLoading ? (
            <div>Loading...</div>
        ) : (
        isSelectingExercise ? (
            <ExerciseSelect 
                exercises={exercises}
                cancelSelect={cancelSelect}
                selectExercise={selectExercise}
            />
        ) : (
        <div className="route-container">
            <div className="edit-template-options">
                <button 
                    className="edit-template-options-button"
                    onClick={() => {
                        localStorage.removeItem("templateToEdit");
                        navigate("/workout");
                    }}
                >
                    Cancel
                </button>
                <p className="edit-template-options-text">Edit Workout Template</p>
                <button 
                    className="edit-template-options-button"
                    onClick={() => saveWorkoutTemplate()}
                >
                    Save
                </button>
            </div>
            <div className="edit-template-form">
                {message.length > 0 && <p className="message">{message}</p>}
                <input 
                    type="text"
                    className="edit-template-title input-default"
                    onChange={(e) => setWorkoutName(e.target.value)}
                    placeholder="Template Name"
                    value={workoutName}
                />
                <hr className="line"/>
                {
                    workoutTemplate.exercise_templates.map((exerciseTemplate, exIdx) => (
                        <ExerciseTemplateElement 
                            key={exIdx} 
                            exIdx={exIdx} 
                            exerciseTemplate={exerciseTemplate}
                            deleteExerciseTemplate={deleteExerciseTemplate}
                            updateExerciseTemplate={updateExerciseTemplate}
                            exercise={getExerciseByName(exerciseTemplate.exercise_name)}
                        />
                    ))
                }
                <button 
                    className="edit-template-add-exercise-button"
                    onClick={() => {
                        setIsSelectingExercise(true)
                    }}
                >
                    Add Exercise
                </button>
                {
                    workoutTemplate.id && 
                    <>
                        <p className="other-template-options">Other Template Options:</p>
                        <button 
                            className="delete-template-button"
                            onClick={() => setIsDeleting(true)}
                        >
                            Delete Template
                        </button>
                        {
                            isDeleting && 
                            <div className="are-you-sure-container">
                                <p>Are you sure you want to delete this template?</p>
                                <div className="are-you-sure-button-container">
                                    <button 
                                        className="are-you-sure-button are-you-sure-cancel-button"
                                        onClick={() => setIsDeleting(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="are-you-sure-button are-you-sure-delete-button"
                                        onClick={() => deleteWorkoutTemplate()}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        }
                    </>
                }
            </div>
        </div>
        )
        )}
    </>
    );
}


export default EditTemplatePage;