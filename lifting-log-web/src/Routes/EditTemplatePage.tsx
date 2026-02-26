import "./EditTemplatePage.css";
import React, { JSX, useEffect, useState } from "react";
import { WorkoutTemplate, ExerciseTemplate, SetTemplate, Exercise, Token, HTTPException } from "../types";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { ExerciseSelect, fetchExercises } from "../Components/ExerciseSelect";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type SetTemplateProps = {
    setIdx: number
    setTemplate: SetTemplate
    isReps: boolean
    isRepRange: boolean
    isTime: boolean
}

type ExerciseTemplateProps = {
    exIdx: number
    exerciseTemplate: ExerciseTemplate
    exercise: Exercise
    handleRoutineNoteChange: (exIdx: number, newRoutineNote: string) => void
    handleExerciseTemplateDelete: (exIdx: number) => void
}

const select0To59: Array<string> = Array.from({ length: 60}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));
const select0To23: Array<string> = Array.from({ length: 24}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));

const SetTemplateElement = ({ setIdx, setTemplate, isReps, isRepRange, isTime }: SetTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const hour: string = (setTemplate.time ? setTemplate.time.substring(0, 2) : "00");
    const minute: string = (setTemplate.time ? setTemplate.time.substring(3, 5) : "00");
    const second: string = (setTemplate.time ? setTemplate.time.substring(6, 8) : "00");


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
                value={setTemplate.reps}
                placeholder="0"
                onChange={(e) => console.log("update reps")}
            />}
            
            {isRepRange && 
            <p className="edit-template-set-row-item-rep-range">
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={setTemplate.rep_range_start}
                    placeholder="0"
                    onChange={(e) => console.log("update rep range start")}
                />
                -
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={setTemplate.rep_range_end}
                    placeholder="0"
                    onChange={(e) => console.log("update rep range end")}
                />
            </p>}
            {isTime && 
            <div 
                className="edit-template-set-row-item time-container"
            >
                <select defaultValue={hour} onChange={(e) => console.log("update hour")}>
                    {select0To23.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={minute} onChange={(e) => console.log("update minute")}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={second} onChange={(e) => console.log("update second")}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
            </div>}
            <button 
                className="delete-button"
                onClick={() => console.log("delete set")}
            >
                D
            </button>
        </div>
    );
}

const ExerciseTemplateElement = ({ exIdx, exerciseTemplate, exercise, handleRoutineNoteChange, handleExerciseTemplateDelete }: ExerciseTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isReps: boolean = exercise.reps && !exercise.weight;
    const isRepRange: boolean = exercise.reps && exercise.weight;
    const isTime: boolean = exercise.time;

    useEffect(() => {
        setIsLoading(false);
    }, []);

    return (
    <Draggable
        draggableId={exIdx.toString()}
        index={exIdx}
    >
    {(provided) => (
        <div
            className="edit-template-exercise"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
        >
            <div className="edit-template-exercise-header">
                {/* <p className="edit-template-exercise-index">{exIdx+1}. </p> */}
                <p className="edit-template-exercise-name">{exerciseTemplate.exercise_name}</p>
                <button 
                    className="delete-button"
                    onClick={() => handleExerciseTemplateDelete(exIdx)}
                >
                    D
                </button>
            </div>
            <textarea
                className="input-default routine-note"
                placeholder="Routine Note"
                value={exerciseTemplate.routine_note}
                onChange={(e) => handleRoutineNoteChange(exIdx, e.target.value)}
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
                    />
                ))}
                <button 
                    className="add-set-button"
                    onClick={() => console.log("add set")}
                >
                    Add Set
                </button>
            </div>
        </div>
    )}
    </Draggable>
    );
}

const EditTemplatePage = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    // complete template state
    const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate>({name: "", exercise_templates: []} as WorkoutTemplate);
    // exercise list
    const [exercises, setExercises] = useState<Array<Exercise>>([]);
    // conditional for deleting template
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    // variables for adding in exercise
    const [isSelectingExercise, setIsSelectingExercise] = useState<boolean>(false);

    const handleWorkoutTemplateNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            name: event.target.value
        }));
    };

    const handleRoutineNoteChange = (exIdx: number, newRoutineNote: string): void => {
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: prevWorkoutTemplate.exercise_templates.map((exerciseTemplate, i) => (
                i === exIdx ?
                {
                    ...exerciseTemplate,
                    routine_note: newRoutineNote
                } :
                exerciseTemplate
            ))
        }));
    };

    const handleExerciseTemplateDelete = (exIdx: number): void => {
        const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
        newExerciseTemplates.splice(exIdx, 1);
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: newExerciseTemplates
        }));
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
        const templateToEditString: string | null = localStorage.getItem("templateToEdit");
        if (templateToEditString) {
            const initTemplate: WorkoutTemplate = JSON.parse(templateToEditString) as WorkoutTemplate;
            setWorkoutTemplate(initTemplate);
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
                    onChange={handleWorkoutTemplateNameChange}
                    placeholder="Template Name"
                    value={workoutTemplate.name}
                />
                <hr className="line"/>
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

                        console.log("update state when exercise dropped in new spot");
                        // setWorkoutTemplate((prevWorkoutTemplate) => {
                        //     const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
                        //     const exerciseTemplateToMove: ExerciseTemplate = newExerciseTemplates[source.index];
                        //     newExerciseTemplates.splice(source.index, 1);
                        //     newExerciseTemplates.splice(destination.index, 0, exerciseTemplateToMove);

                        //     return {
                        //         ...prevWorkoutTemplate,
                        //         exercise_templates: newExerciseTemplates
                        //     };
                        // });
                    }}
                >
                    <Droppable droppableId="exercise-template-droppable">
                        {provided => (
                            <div 
                                className="exercise-templates-container"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                            {
                                workoutTemplate.exercise_templates.map((exerciseTemplate, exIdx) => (
                                    <ExerciseTemplateElement 
                                        key={exIdx} 
                                        exIdx={exIdx} 
                                        exerciseTemplate={exerciseTemplate}
                                        exercise={getExerciseByName(exerciseTemplate.exercise_name)}
                                        handleRoutineNoteChange={handleRoutineNoteChange}
                                        handleExerciseTemplateDelete={handleExerciseTemplateDelete}
                                    />
                                ))
                            }
                            {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
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