import "./Home.css"
import { Navigate } from "react-router";
import { getUser } from "../auth";
import { serverUrlProps, User } from "../types";

function Home({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const user: User | null = getUser(serverUrl);

    if (user === null) {
        return <Navigate to="/login" />
    }

    console.log(user);

    return (
        <div className="home">
            Home Page
        </div>
    );
}

export default Home;