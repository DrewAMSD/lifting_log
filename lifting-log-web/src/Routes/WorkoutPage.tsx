import "./WorkoutPage.css"
import { useState } from "react";
import { Navigate } from "react-router"
import { getUser } from "../auth"
import { serverUrlProps } from "../types";

function WorkoutPage({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const [user, setUser] = useState(getUser);

    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="workout-page">
            WorkoutPage
        </div>
    );
}

export default WorkoutPage;