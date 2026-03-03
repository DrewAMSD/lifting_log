import "./Home.css"
import { JSX } from "react";
import { useAuth } from "../../AuthProvider";

const Home = (): JSX.Element => {
    const { serverUrl, user } = useAuth();

    return (
        <div className="route-container" id="home">
            Home Page
        </div>
    );
}

export default Home;