import "./ExerciseEntryComponent.css";
import { JSX } from "react";
import { ExerciseEntry } from "../../types";

type ExerciseEntryProps = {
    exIdx: number
    exerciseEntry: ExerciseEntry
}

const ExerciseEntryComponent = ({exIdx, exerciseEntry}: ExerciseEntryProps): JSX.Element => {
    

    return (
        <div className="wo-exercise-entry-container">
            Exercise Entry
        </div>
    );
};

export default ExerciseEntryComponent;