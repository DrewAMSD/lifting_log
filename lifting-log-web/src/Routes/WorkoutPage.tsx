import "./WorkoutPage.css"
import { Navigate } from "react-router"
import { getUser } from "../auth"
import { serverUrlProps, User } from "../types";

function WorkoutPage({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const user: User | null = getUser(serverUrl);

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