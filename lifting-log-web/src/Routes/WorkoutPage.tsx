import "./WorkoutPage.css";
import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";

const WorkoutPage = () => {
    const { serverUrl, user } = useAuth();

    return (
        <div className="workout-page">
            Workout Page
        </div>
    );
}

export default WorkoutPage;