import "./Home.css"
import { Navigate } from "react-router";
import { useState } from "react";
import { getUser } from "../auth";
import { serverUrlProps, User } from "../types";

function Home({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const [user, setUser] = useState<User | null>(getUser);

    if (user === null) {
        return <Navigate to="/login" />
    }

    return (
        <div className="home">
            Home Page
        </div>
    );
}

export default Home;