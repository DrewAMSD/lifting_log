import "./Settings.css";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../AuthProvider";

const Settings = () => {
    const { serverUrl, user, logout } = useAuth();
    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="settings">
            Settings Page
            <button onClick={logout}>Click to Sign Out</button>
        </div>
    );
}

export default Settings;