import "./Settings.css";
import { Navigate, NavigateFunction, useNavigate } from "react-router";
import { getUser } from "../auth";
import { serverUrlProps, User } from "../types";

function Settings({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const user: User | null = getUser(serverUrl);
    const navigate: NavigateFunction = useNavigate();

    if (user === null) {
        return <Navigate to="/login" />
    }

    const handleSignOut = (): void => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="settings">
            Settings Page
            <button onClick={handleSignOut}>Click to Sign Out</button>
        </div>
    );
}

export default Settings;