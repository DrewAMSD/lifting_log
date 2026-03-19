import { Exercise, SetEntry } from "../../types";
import "./SetEntryComponent.css";
import React, { JSX } from "react";

type SetEntryProps = {
    exIdx: number
    setIdx: number
    setEntry: SetEntry
    exercise: Exercise
    handleDeleteSetEntry: (setIdx: number) => void
    updateSetEntry: (exIdx: number, setIdx: number, newSetEntry: SetEntry) => void
}

const select0To59: Array<string> = Array.from({ length: 60}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));
const select0To23: Array<string> = Array.from({ length: 24}, (_, i) => (i < 10 ? "0"+i.toString(): i.toString()));

const SetEntryComponent = ({ exIdx, setIdx, setEntry, exercise, handleDeleteSetEntry, updateSetEntry }: SetEntryProps): JSX.Element => {
    const hour: string = (setEntry.time ? setEntry.time.substring(0, 2) : "00");
    const minute: string = (setEntry.time ? setEntry.time.substring(3, 5) : "00");
    const second: string = (setEntry.time ? setEntry.time.substring(6, 8) : "00");

    const handleUpdateWeight = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newWeight = setEntry.weight || 0;
        if (!Number.isNaN(event.target.value)) {
            newWeight = parseInt(event.target.value);
        }
        if (setEntry.submitted && event.target.value === "") {
            newWeight = 0
        }

        const newSetEntry: SetEntry = {
            ...setEntry,
            weight: newWeight
        }
        updateSetEntry(exIdx, setIdx, newSetEntry);
    };

    const handleUpdateReps = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newReps = setEntry.reps || 0;
        if (!Number.isNaN(event.target.value)) {
            newReps = parseInt(event.target.value);
        }

        const newSetEntry: SetEntry = {
            ...setEntry,
            reps: newReps
        }
        updateSetEntry(exIdx, setIdx, newSetEntry);
    };

    const updateTime = (newTime: string): void => {
        const newSetEntry: SetEntry = {
            ...setEntry,
            time: newTime
        }
        updateSetEntry(exIdx, setIdx, newSetEntry);
    };

    const handleHourChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setEntry.time) {
            const newTime: string = event.target.value+":00:00";
            updateTime(newTime);
            return;
        }
        const newTime: string = event.target.value+setEntry.time.substring(2);
        updateTime(newTime);
    };

    const handleMinuteChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setEntry.time) {
            const newTime: string = "00:"+event.target.value+":00";
            updateTime(newTime);
            return;
        }
        const newTime: string = setEntry.time.substring(0, 3)+event.target.value+setEntry.time.substring(5);
        updateTime(newTime);
    };

    const handleSecondChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        if (!setEntry.time) {
            const newTime: string = "00:00:"+event.target.value;
            updateTime(newTime);
            return;
        }
        const newTime: string = setEntry.time.substring(0, 6)+event.target.value;
        updateTime(newTime);
    };

    const handleSubmit = (): void => {
        const newSubmitValue = setEntry.submitted ? !setEntry.submitted : true;
        const newSetEntry: SetEntry = {
            ...setEntry,
            submitted: newSubmitValue,
            weight: setEntry.weight || 0
        }
        updateSetEntry(exIdx, setIdx, newSetEntry);
    };

    return (
        <div
            className="set-entry-container"   
            style={{
                backgroundColor: (setIdx % 2 == 0) ? 
                (setEntry.submitted ? "rgb(30, 151, 0)" : "transparent") : 
                (setEntry.submitted ? "rgb(35, 173, 0)" : "rgb(60, 60, 60)"),
                // opacity: setEntry.submitted ? 0.5 : 1
            }}         
        >
            <p className="set-entry-item set-entry-index">{setIdx + 1}</p>
            {/* Change these to inputs later */}
            {exercise.weight && 
                <input 
                    type="number"
                    inputMode="numeric"
                    className="set-entry-item set-entry-weight input-default" 
                    value={setEntry.weight || ""}
                    placeholder="0"
                    maxLength={20}
                    onChange={handleUpdateWeight}
                />
            } 
            {exercise.reps && 
                <input 
                    type="text"
                    inputMode="numeric"
                    className="set-entry-item set-entry-reps input-default" 
                    value={setEntry.reps || ""}
                    placeholder="0"
                    maxLength={20}
                    onChange={handleUpdateReps}
                />
            }
            {exercise.time && 
                <div 
                    className="set-entry-item set-entry-time set-entry-time-container"
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
            </div>
            }
            <button
            className="set-entry-item set-entry-submit"
                style={{
                    backgroundColor: (setEntry.submitted ? "green" : "rgb(75, 75, 75)"),
                    border: 0
                }}
                onClick={handleSubmit}
            >
                ✓
            </button>
            <button 
                className="set-entry-delete-button"
                onClick={() => handleDeleteSetEntry(setIdx)}
            >
                D
            </button>
        </div>
    )
}

export default SetEntryComponent;