import "./EditTemplatePage.css";
import React, { JSX, useEffect, useState } from "react";
import { WorkoutTemplate, ExerciseTemplate, SetTemplate, Exercise, Token, HTTPException } from "../types";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { ExerciseSelect, FetchExercises } from "../Components/ExerciseSelect";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type SetTemplateProps = {
    exIdx: number
    setIdx: number
    setTemplate: SetTemplate
    isReps: boolean
    isRepRange: boolean
    isTime: boolean
    updateSetTemplate: (exIdx: number, setIdx: number, newSetTemplate: SetTemplate) => void
    handleDeleteSet: (setIdx: number) => void
}

type ExerciseTemplateProps = {
    exIdx: number
    exerciseTemplate: ExerciseTemplate
    exercise: Exercise
    updateExerciseTemplate: (exIdx: number, newExerciseTemplate: ExerciseTemplate) => void
    deleteExerciseTemplate: (exIdx: number) => void
    updateSetTemplate: (exIdx: number, setIdx: number, newSetTemplate: SetTemplate) => void
}

const select0To59: Array<string> = Array.from({ length: 60}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));
const select0To23: Array<string> = Array.from({ length: 24}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));

const SetTemplateElement = ({ exIdx, setIdx, setTemplate, isReps, isRepRange, isTime, updateSetTemplate, handleDeleteSet }: SetTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const hour: string = (setTemplate.time ? setTemplate.time.substring(0, 2) : "00");
    const minute: string = (setTemplate.time ? setTemplate.time.substring(3, 5) : "00");
    const second: string = (setTemplate.time ? setTemplate.time.substring(6, 8) : "00");

    const handleRepsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newReps: number = setTemplate.reps || 0;
        if (!Number.isNaN(event.target.value)) {
            newReps = parseInt(event.target.value);
        }
        const newSetTemplate: SetTemplate = {
            ...setTemplate,
            reps: newReps
        }
        updateSetTemplate(exIdx, setIdx, newSetTemplate);
    };

    const handleRepRangeStartChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newRepRangeStart: number = setTemplate.rep_range_start || 0;
        if (!Number.isNaN(event.target.value)) {
            newRepRangeStart = parseInt(event.target.value);
        }
        const newSetTemplate: SetTemplate = {
            ...setTemplate,
            rep_range_start: newRepRangeStart
        }
        updateSetTemplate(exIdx, setIdx, newSetTemplate);
    };

    const handleRepRangeEndChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newRepRangeEnd: number = setTemplate.rep_range_end || 0;
        if (!Number.isNaN(event.target.value)) {
            newRepRangeEnd = parseInt(event.target.value);
        }
        const newSetTemplate: SetTemplate = {
            ...setTemplate,
            rep_range_end: newRepRangeEnd
        }
        updateSetTemplate(exIdx, setIdx, newSetTemplate);
    };

    const updateTime = (newTime: string): void => {
        const newSetTemplate: SetTemplate = {
            ...setTemplate,
            time: newTime
        }
        updateSetTemplate(exIdx, setIdx, newSetTemplate);
    };

    const handleHourChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setTemplate.time) {
            const newTime: string = event.target.value+":00:00";
            updateTime(newTime);
            return;
        }
        const newTime: string = event.target.value+setTemplate.time.substring(2);
        updateTime(newTime);
    };

    const handleMinuteChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setTemplate.time) {
            const newTime: string = "00:"+event.target.value+":00";
            updateTime(newTime);
            return;
        }
        const newTime: string = setTemplate.time.substring(0, 3)+event.target.value+setTemplate.time.substring(5);
        updateTime(newTime);
    };

    const handleSecondChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setTemplate.time) {
            const newTime: string = "00:00:"+event.target.value;
            updateTime(newTime);
            return;
        }
        const newTime: string = setTemplate.time.substring(0, 6)+event.target.value;
        updateTime(newTime);
    };

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
                value={setTemplate.reps || ""}
                placeholder="0"
                onChange={handleRepsChange}
            />}
            
            {isRepRange && 
            <p className="edit-template-set-row-item-rep-range">
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={setTemplate.rep_range_start || ""}
                    placeholder="0"
                    onChange={handleRepRangeStartChange}
                />
                -
                <input 
                    type="text"
                    inputMode="numeric"
                    className="rep-range input-default" 
                    value={setTemplate.rep_range_end || ""}
                    placeholder="0"
                    onChange={handleRepRangeEndChange}
                />
            </p>}
            {isTime && 
            <div 
                className="edit-template-set-row-item time-container"
            >
                <select defaultValue={hour} onChange={handleHourChange}>
                    {select0To23.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={minute} onChange={handleMinuteChange}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
                :
                <select defaultValue={second} onChange={handleSecondChange}>
                    {select0To59.map((i) => (
                        <option value={i} key={i}>{i}</option>
                    ))}
                </select>
            </div>}
            <button 
                className="delete-button"
                onClick={() => handleDeleteSet(setIdx)}
            >
                D
            </button>
        </div>
    );
}

const ExerciseTemplateElement = ({ exIdx, exerciseTemplate, exercise, updateExerciseTemplate, deleteExerciseTemplate, updateSetTemplate }: ExerciseTemplateProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isReps: boolean = exercise.reps && !exercise.weight;
    const isRepRange: boolean = exercise.reps && exercise.weight;
    const isTime: boolean = exercise.time;

    const handleRoutineNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const newExerciseTemplate: ExerciseTemplate = {
            ...exerciseTemplate,
            routine_note: event.target.value
        };
        updateExerciseTemplate(exIdx, newExerciseTemplate);        
    };

    const handleDeleteSet = (setIdx: number): void => {
        const newSetTemplates: Array<SetTemplate> = exerciseTemplate.set_templates;
        newSetTemplates.splice(setIdx, 1);
        const newExerciseTemplate: ExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    }

    const handleAddSet = (): void => {
        const newExerciseTemplate: ExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: [
                ...exerciseTemplate.set_templates,
                {}
            ]
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    };

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
            ref={provided.innerRef}
        >
            <div className="edit-template-exercise-header">
                {/* <p className="edit-template-exercise-index">{exIdx+1}. </p> */}
                <p 
                    className="edit-template-exercise-name"
                    {...provided.dragHandleProps}
                >
                    {exerciseTemplate.exercise_name}
                </p>
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
                value={exerciseTemplate.routine_note}
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
                        exIdx={exIdx}
                        setIdx={setIdx} 
                        setTemplate={setTemplate} 
                        isReps={isReps} 
                        isRepRange={isRepRange} 
                        isTime={isTime}
                        updateSetTemplate={updateSetTemplate}
                        handleDeleteSet={handleDeleteSet}
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
    
    const updateExerciseTemplate = (exIdx: number, newExerciseTemplate: ExerciseTemplate): void => {
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: prevWorkoutTemplate.exercise_templates.map((prevExerciseTemplate, i) => (
                i === exIdx ?
                {
                    ...prevExerciseTemplate,
                    routine_note: newExerciseTemplate.routine_note,
                    set_templates: newExerciseTemplate.set_templates.map((newSetTemplate) => (
                        {
                            ...newSetTemplate
                        }
                    ))
                } :
                prevExerciseTemplate
            ))
        }));
    };

    const updateSetTemplate = (exIdx: number, setIdx: number, newSetTemplate: SetTemplate): void => {
        setWorkoutTemplate(prevWorkoutTemplate => ({
            ...prevWorkoutTemplate,
            exercise_templates: prevWorkoutTemplate.exercise_templates.map((prevExerciseTemplate, i) => (
                i === exIdx ?
                {
                    ...prevExerciseTemplate,
                    set_templates: prevExerciseTemplate.set_templates.map((prevSetTemplate, j) => (
                        j === setIdx ?
                        {
                            ...newSetTemplate
                        } :
                        prevSetTemplate
                    ))
                } :
                prevExerciseTemplate
            ))
        }));
    };

    const deleteExerciseTemplate = (exIdx: number): void => {
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
    };

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
    };

    useEffect(() => {
        const templateToEditString: string | null = localStorage.getItem("templateToEdit");
        if (templateToEditString) {
            const initTemplate: WorkoutTemplate = JSON.parse(templateToEditString) as WorkoutTemplate;
            setWorkoutTemplate(initTemplate);
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

                        setWorkoutTemplate((prevWorkoutTemplate) => {
                            const newExerciseTemplates: Array<ExerciseTemplate> = [...workoutTemplate.exercise_templates];
                            const exerciseTemplateToMove: ExerciseTemplate = newExerciseTemplates[source.index];
                            newExerciseTemplates.splice(source.index, 1);
                            newExerciseTemplates.splice(destination.index, 0, exerciseTemplateToMove);

                            return {
                                ...prevWorkoutTemplate,
                                exercise_templates: newExerciseTemplates
                            };
                        });
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
                                        updateExerciseTemplate={updateExerciseTemplate}
                                        deleteExerciseTemplate={deleteExerciseTemplate}
                                        updateSetTemplate={updateSetTemplate}
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