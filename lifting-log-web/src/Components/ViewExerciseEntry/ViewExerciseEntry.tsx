import { JSX } from "react";
import "./ViewExerciseEntry.css";
import { ExerciseEntry } from "../../types";
import ViewSetEntry from "../ViewSetEntry/ViewSetEntry";

type ViewExerciseEntryProps = {
    eIdx: number
    exerciseEntry: ExerciseEntry
}

const ViewExerciseEntry = ({ eIdx, exerciseEntry }: ViewExerciseEntryProps): JSX.Element => {

    return (
        <div className="view-ee-container">
            <p className="view-ee-name">{exerciseEntry.exercise_name}</p>
            {exerciseEntry.description && 
                <p className="view-ee-description">{exerciseEntry.description}</p>
            }

            {
                exerciseEntry.set_entries.length === 0 ? (
                    <p className="no-sets-here">No Sets Here</p>
                ) : (
                    <div className="view-ee-sets-container">
                        <div className="view-se-container">
                            <p className="view-se-item view-se-item-light">Set</p>
                            {exerciseEntry.set_entries[0].weight && <p className="view-se-item view-se-item-light">Weight</p>}
                            {exerciseEntry.set_entries[0].reps && <p className="view-se-item view-se-item-light">Reps</p>}
                            {exerciseEntry.set_entries[0].time && <p className="view-se-item view-se-item-light">Time</p>}
                        </div>
                        {
                            exerciseEntry.set_entries.map((setEntry, sIdx) => (
                                <ViewSetEntry 
                                    key={sIdx}
                                    sIdx={sIdx}
                                    setEntry={setEntry}
                                />
                            ))
                        }
                    </div>
                )
            }
        </div>
    )
}

export default ViewExerciseEntry;