import "./EditTemplatePage.css";
import React, { useEffect, useState } from "react";
import { WorkoutTemplate, ExerciseTemplate, SetTemplate } from "../types";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";

type ExerciseTemplateProps = {
    exIdx: number,
    exerciseTemplate: ExerciseTemplate
    deleteExerciseTemplate: (exIdx: number) => void,
    updateExerciseTemplate: (exIdx: number, newExerciseTemplate: ExerciseTemplate) => void
}

type SetTemplateProps = {
    setIdx: number,
    setTemplate: SetTemplate,
    isReps: boolean,
    isRepRange: boolean,
    isTime: boolean,
    deleteSet: (setIdx: number) => void
}

const SetTemplateElement = ({ setIdx, setTemplate, isReps, isRepRange, isTime, deleteSet }: SetTemplateProps) => {
    return (
        <div 
        className="edit-template-set-row">
            <p className="edit-template-set-row-item">{setIdx+1}</p>
            {isReps && 
            <input 
            type="number"
            className="edit-template-set-row-item input-default" 
            value={""+setTemplate.reps}
            placeholder="0"
            />}
            {isRepRange && 
            <p className="edit-template-set-row-item">{setTemplate.rep_range_start}-{setTemplate.rep_range_end}</p>}
            {isTime && 
            <p className="edit-template-set-row-item">{setTemplate.time}</p>}
            <button 
            className="delete-button"
            onClick={() => deleteSet(setIdx)}
            >
                D
            </button>
        </div>
    );
}

const ExerciseTemplateElement = ({ exIdx, exerciseTemplate, deleteExerciseTemplate, updateExerciseTemplate }: ExerciseTemplateProps) => {
    // TODO: change these 3 fields to check against the actual exercise type (weight+reps = repRange, reps = isReps, time = isTime)
    const isReps: boolean = (exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].reps ? true : false) : false);
    const isRepRange: boolean = (exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].rep_range_start ? true : false) : false);
    const isTime: boolean = (exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].time ? true : false) : false);

    const handleRoutineNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement, HTMLTextAreaElement>): void => {
        event.target.style.height = "inherit";
        event.target.style.height = event.target.scrollHeight+"px";
        const newExerciseTemplate = {
            ...exerciseTemplate,
            routine_note: event.target.value
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    }

    const handleAddSet = (): void => {
        const newSetTemplates: Array<SetTemplate> = [...exerciseTemplate.set_templates];
        newSetTemplates.push({} as SetTemplate);
        const newExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    }

    const deleteSet = (setIdx: number): void => {
        const newSetTemplates: Array<SetTemplate> = [...exerciseTemplate.set_templates];
        newSetTemplates.splice(setIdx, 1);
        const newExerciseTemplate = {
            ...exerciseTemplate,
            set_templates: newSetTemplates
        }
        updateExerciseTemplate(exIdx, newExerciseTemplate);
    }

    // TODO: add updateSet option for when changing set values (need to first update SetTempalte functionality to allow changes)

    return (
        <div
        className="edit-template-exercise"
        >
            <div className="edit-template-exercise-header">
                <p className="edit-template-exercise-name">{exIdx+1}. </p>
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
            value={exerciseTemplate.routine_note}
            onChange={handleRoutineNoteChange}
            />
            <hr className="line"/>
            <div className="edit-template-set">
                <div className="edit-template-set-row">
                    <p className="edit-template-set-row-item">Set</p>
                    {isReps && <p className="edit-template-set-row-item">Reps</p>}
                    {isRepRange && <p className="edit-template-set-row-item">Rep Range</p>}
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
                        deleteSet={deleteSet}
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

const EditTemplatePage = () => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate>({name: "", exercise_templates: []} as WorkoutTemplate);
    // TODO: add a fetch to grab all exercises available to the user (might want to make it global, or pass it down through props)

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

    useEffect(() => {
        const templateToEditString: string | null = localStorage.getItem("templateToEdit");
        if (templateToEditString) {
            const initTemplate: WorkoutTemplate = JSON.parse(templateToEditString) as WorkoutTemplate;
            setWorkoutTemplate(initTemplate);
        }
        // part of todo at top of this element, in here is where fetch for exercises will be
        setIsLoading(false);
    }, []);

    return (
    <>
        {isLoading ? (
            <div>Loading...</div>
        ) : (
        <>
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
            >
                Save
            </button>
            </div>
            <div className="edit-template-form">
                <input 
                    type="text"
                    className="edit-template-title input-default"
                    onChange={
                        (event) => {setWorkoutTemplate((prevWorkoutTemplate) => ({
                            ...prevWorkoutTemplate, 
                            name: event.target.value
                        }))}
                    }
                    placeholder="Template Name"
                    value={workoutTemplate.name}
                    required
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
                        />
                    ))
                }
                <button 
                className="edit-template-add-exercise-button"
                >
                    Add Exercise
                </button>
            </div>
        </>
        )}
    </>
    );
}


export default EditTemplatePage;