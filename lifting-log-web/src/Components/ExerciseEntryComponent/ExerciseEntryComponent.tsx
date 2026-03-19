import "./ExerciseEntryComponent.css";
import "../SetEntryComponent/SetEntryComponent.css"
import React, { JSX } from "react";
import { Exercise, ExerciseEntry, SetEntry } from "../../types";
import { Draggable } from "@hello-pangea/dnd";
import SetEntryComponent from "../SetEntryComponent/SetEntryComponent";

type ExerciseEntryProps = {
    exIdx: number
    exerciseEntry: ExerciseEntry
    exercise: Exercise
    updateExerciseEntry: (exIdx: number, newExerciseEntry: ExerciseEntry) => void
    deleteExerciseEntry: (exIdx: number) => void
    updateSetEntry: (exIdx: number, setIdx: number, newSetEntry: SetEntry) => void
}

const ExerciseEntryComponent = ({ exIdx, exerciseEntry, exercise, updateExerciseEntry, deleteExerciseEntry, updateSetEntry }: ExerciseEntryProps): JSX.Element => {

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const newExerciseEntry: ExerciseEntry = exerciseEntry;
        newExerciseEntry.description = event.target.value;
        updateExerciseEntry(exIdx, newExerciseEntry);
    };

    const handleDeleteSetEntry = (setIdx: number): void => {
        if (exerciseEntry.set_entries.length <= 1) {
            return;
        }
        const newSetEntries: Array<SetEntry> = exerciseEntry.set_entries;
        newSetEntries.splice(setIdx, 1);
        const newExerciseEntry: ExerciseEntry = {
            ...exerciseEntry,
            set_entries: newSetEntries
        }
        updateExerciseEntry(exIdx, newExerciseEntry);
    };

    const handleAddSetEntry = (): void => {
        const newSetEntries: Array<SetEntry> = exerciseEntry.set_entries;
        const newSetEntry: SetEntry = {} as SetEntry;
        newSetEntries.push(newSetEntry);
        const newExerciseEntry: ExerciseEntry = {
            ...exerciseEntry,
            set_entries: newSetEntries
        }
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
                <textarea
                    className="input-default exercise-entry-description"
                    value={exerciseEntry.description}
                    placeholder="description" // potential: get previous time this exercise was done and put as placeholder here
                    onChange={handleDescriptionChange}
                    maxLength={512}
                />
                <div className="exercise-entry-sets-container">
                <div className="set-entry-container">
                    <p className="set-entry-item set-entry-index">Set</p>
                    {exercise.weight && <p className="set-entry-item set-entry-item-header set-entry-weight">Weight</p>}
                    {exercise.reps && <p className="set-entry-item set-entry-item-header set-entry-reps">Reps</p>}
                    {exercise.time && <p className="set-entry-item set-entry-item-header set-entry-time">Time</p>}
                </div>
                {
                    exerciseEntry.set_entries.map((setEntry, setIdx) => (
                        <SetEntryComponent 
                            key={setIdx}
                            exIdx={exIdx}
                            setIdx={setIdx}
                            setEntry={setEntry}
                            exercise={exercise}
                            handleDeleteSetEntry={handleDeleteSetEntry}
                            updateSetEntry={updateSetEntry}
                        />
                    ))
                }
                </div>
                <button
                    className="exercise-entry-add-set-button"
                    onClick={handleAddSetEntry}
                >
                    Add Set
                </button>
            </div>
        )}
        </Draggable>
    )
};

export default ExerciseEntryComponent;