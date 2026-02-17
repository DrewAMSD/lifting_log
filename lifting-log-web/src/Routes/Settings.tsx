import "./Settings.css";
import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";

const Settings = () => {
    const { serverUrl, user, logout } = useAuth();

    return (
        <div className="settings">
            Settings Page
            <button onClick={logout}>Click to Sign Out</button>
        </div>
    );
}

export default Settings;