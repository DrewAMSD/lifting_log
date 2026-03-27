import "./WorkoutPreviewCard.css";
import { JSX } from "react";
import { Workout } from "../../types";

type WorkoutPreviewProps = {
    workout: Workout
    onSelect: () => void
}

const WorkoutPreviewCard = ({ workout, onSelect }: WorkoutPreviewProps): JSX.Element => {
    // date fields
    const year: number = Math.floor(workout.date / 10000);
    const month: number = (Math.floor(workout.date / 100) % 100);
    const day: number = (workout.date % 100);
    const date: Date = new Date(year, month-1, day);
    // duration fields
    const hours = parseInt(workout.duration.substring(0, 2));
    const minutes = parseInt(workout.duration.substring(3, 5));
    const seconds = parseInt(workout.duration.substring(6, 8));

    return (
        <div
            className="workout-preview-container"
            onClick={onSelect}
        >
            <p className="workout-preview-name">{workout.name}</p>
            <hr className="line line-light"/>
            <div className="workout-preview-date-container">
                <p className="workout-preview-date">{date.toLocaleString("default", { weekday: "long" })}, </p>
                <p className="workout-preview-date">{date.toLocaleString("default", { month: "long" })}</p>
                <p className="workout-preview-date">{day}, </p>
                <p className="workout-preview-date">{year}</p>
            </div>
            <div className="workout-preview-duration-container">
                {hours !== 0 && <p className="workout-preview-duration">{hours} Hr, </p>}
                {minutes !== 0 ? (
                        <p className="workout-preview-duration">{minutes} Min</p>
                    ) : (
                        <p className="workout-preview-duration">{seconds} Sec</p>
                    )
                }
                
            </div>
            <hr className="line line-light"/>
            {
                workout.exercise_entries.map((exercistEntry, exIdx) => (
                    <p className="workout-preview-ex-entry" key={exIdx}>- {exercistEntry.set_entries.length} {exercistEntry.set_entries.length === 1 ? "set" : "sets"} {exercistEntry.exercise_name}</p>
                ))
            }
        </div>
    )
};

export default WorkoutPreviewCard;