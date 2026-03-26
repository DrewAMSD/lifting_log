import "./WorkoutPreview.css";
import { JSX } from "react";
import { Workout } from "../../types";

type WorkoutPreviewProps = {
    workout: Workout
}

const WorkoutPreview = ({ workout }: WorkoutPreviewProps): JSX.Element => {


    return (
        <div>
            {workout.name}
        </div>
    )
};

export default WorkoutPreview;