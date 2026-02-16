import "./Home.css"
import { useState, useEffect } from "react";
import { useNavigate, NavigateFunction } from "react-router";
import { getUser } from "../auth";
import { serverUrlProps, User } from "../types";

function Home({ url }: serverUrlProps) {
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

    return (
    <>
        {user ? (
            <div className="home">
                Home Page
            </div>
        ) : (
            <div>Loading...</div>
        )}
    </>
    );
}

export default Home;