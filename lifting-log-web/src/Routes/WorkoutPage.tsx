import "./WorkoutPage.css";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../AuthProvider";

const WorkoutPage = () => {
    const { serverUrl, user } = useAuth();
    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="workout-page">
            Workout Page
        </div>
    );
}

export default WorkoutPage;