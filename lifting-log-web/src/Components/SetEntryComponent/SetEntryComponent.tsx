import { Exercise, SetEntry } from "../../types";
import "./SetEntryComponent.css";
import { JSX } from "react";

type SetEntryProps = {
    setIdx: number
    setEntry: SetEntry
    exercise: Exercise
    handleDeleteSetEntry: (setIdx: number) => void
}

const SetEntryComponent = ({ setIdx, setEntry, exercise, handleDeleteSetEntry }: SetEntryProps): JSX.Element => {
    
    return (
        <div 
            className="set-entry-container"
            style={{
                backgroundColor: (setIdx % 2 == 0) ? "transparent" : "rgb(60, 60, 60)"
            }}
        >
            <p className="set-entry-item set-entry-index">{setIdx + 1}</p>
            {/* Change these to inputs later */}
            {exercise.weight && <p className="set-entry-item set-entry-weight">W</p>} 
            {exercise.reps && <p className="set-entry-item set-entry-reps">R</p>}
            {exercise.time && <p className="set-entry-item set-entry-time">T</p>}
            <button 
                className="delete-button"
                onClick={() => handleDeleteSetEntry(setIdx)}
            >
                D
            </button>
        </div>
    )
}

export default SetEntryComponent;