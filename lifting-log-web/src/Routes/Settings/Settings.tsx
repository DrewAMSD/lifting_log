import "./Settings.css";
import { JSX, useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../AuthProvider";
import { HTTPException } from "../../types";

type UserMetaData = {
    username: string,
    email: string,
    full_name: string
}

const Settings = (): JSX.Element => {
    const { serverUrl, user, logoutUser, deleteUser, getToken } = useAuth();
    const [userMetaData, setUserMetaData] = useState<UserMetaData>({} as UserMetaData);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    
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
        <div className="route-container" id="settings">
            {
                isConfirming ? (
                    <div id="settings-confirming-container">
                        <p id="confirming-text">Are you sure you want to delete your account?</p>
                        <div id="settings-confirming-buttons-container">
                            <button
                                className="settings-confirming-button"
                                id="cancel-delete"
                                onClick={() => setIsConfirming(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="settings-confirming-button"
                                id="confirm-delete"
                                onClick={deleteUser}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div id="user-info">
                            <div className="user-info-item">
                                <p className="user-info-text">User:</p>
                                <p className="user-info-text">{userMetaData.username}</p>
                            </div>
                            <div className="user-info-item">
                                <p className="user-info-text">Email:</p>
                                <p className="user-info-text">{userMetaData.email}</p>
                            </div>
                            <div className="user-info-item">
                                <p className="user-info-text">Full Name:</p>
                                <p className="user-info-text">{userMetaData.full_name}</p>
                            </div>
                        </div>
                        <button className="sign-out-b" onClick={logoutUser}>Click to Sign Out</button>
                        <button className="delete-account-b" onClick={() => setIsConfirming(true)}>Click to Delete Account</button>
                    </>
                )
            }
        </div>
    );
}

export default Settings;