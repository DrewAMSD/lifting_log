import "./Settings.css";
import { useState, useEffect } from "react";
import { useNavigate, NavigateFunction } from "react-router";
import { getUser, logoutUser } from "../auth";
import { serverUrlProps, User } from "../types";

function Settings({ url }: serverUrlProps) {
    const serverUrl: string = url;
        const navigate: NavigateFunction = useNavigate();
        const [user, setUser] = useState<User | null>(null);
    
        useEffect(() => {
            const fetchUser = async () => {
                try {
                    const req: User | null = await getUser(serverUrl);
    
                    if (req === null) {
                        navigate("/login")
                    }
                    setUser(req);
                }
                catch (error) {
                    console.error("Error fetching user: ", error);
                    navigate("/login")
                }
            }
            fetchUser();
        }, []);

    const handleSignOut = (): void => {
        logoutUser(serverUrl);
        navigate("/login");
    };

    return (
    <>
        {user ? (
            <div className="settings">
                Settings Page
                <button onClick={handleSignOut}>Click to Sign Out</button>
            </div>
            
        ) : (
            <div>Loading</div>
        )}
    </>
    );
}

export default Settings;