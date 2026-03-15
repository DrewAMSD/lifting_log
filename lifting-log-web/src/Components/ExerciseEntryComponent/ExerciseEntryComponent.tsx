import "./ExerciseEntryComponent.css";
import React, { JSX } from "react";
import { ExerciseEntry } from "../../types";
import { Draggable } from "@hello-pangea/dnd";

type ExerciseEntryProps = {
    exIdx: number
    exerciseEntry: ExerciseEntry
    updateExerciseEntry: (exIdx: number, newExerciseEntry: ExerciseEntry) => void
    deleteExerciseEntry: (exIdx: number) => void
}

const ExerciseEntryComponent = ({ exIdx, exerciseEntry, updateExerciseEntry, deleteExerciseEntry }: ExerciseEntryProps): JSX.Element => {
    
    const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const newExerciseEntry: ExerciseEntry = exerciseEntry;
        newExerciseEntry.description = event.target.value;
        updateExerciseEntry(exIdx, newExerciseEntry);
    };

    return (
        <Draggable
            draggableId={exIdx.toString()}
            index={exIdx}
        >
        {(provided) => (
            <div 
                className="exercise-entry-container"
                {...provided.draggableProps}
                ref={provided.innerRef}
            >
                <div
                    className="exercise-entry-header"
                >
                    <p 
                        className="exercise-entry-name"
                        {...provided.dragHandleProps} // can move to parent container for entire div to be drag handle
                    >
                        {exerciseEntry.exercise_name}
                    </p>
                    <button 
                        className="delete-button"
                        onClick={() => deleteExerciseEntry(exIdx)}
                    >
                        D
                    </button>
                </div>
                <p className="exercise-entry-routine-note">
                    {exerciseEntry.routine_note}
                </p>
                <input 
                    type="text"
                    className="input-default"
                    value={exerciseEntry.description}
                    placeholder="description" // potential: get previous time this exercise was done and put as placeholder here
                    onChange={handleDescriptionChange}
                    maxLength={512}
                />
            </div>
        )}
        </Draggable>
    )
};

export default ExerciseEntryComponent;