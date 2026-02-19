import "./Settings.css";
import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { HTTPException } from "../types";

type UserMetaData = {
    username: string,
    email: string,
    full_name: string
}

const Settings = () => {
    const { serverUrl, user, logoutUser, deleteUser, getToken } = useAuth();
    const [userMetaData, setUserMetaData] = useState<UserMetaData>({} as UserMetaData);
    
    useEffect(() => {
        const fetchUserMetaData = async (): Promise<void> => {
            const token: string = await getToken();
            try {
                const response: Response = await fetch(serverUrl+"/users/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "/application/json",
                        "Authorization": "Bearer "+token
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    setUserMetaData(data as UserMetaData);
                } else {
                    const httpException: HTTPException = data as HTTPException;
                    throw new Error(httpException.detail);
                }
            }
            catch (error) {
                console.error("Error: ", error);
            }
        };
        fetchUserMetaData();
    }, []);
    
    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="settings">
            <div>{userMetaData.username}</div>
            <div>{userMetaData.email}</div>
            <div>{userMetaData.full_name}</div>
            <button onClick={logoutUser}>Click to Sign Out</button>
            <button onClick={deleteUser}>Click to Delete Account</button>
        </div>
    );
}

export default Settings;