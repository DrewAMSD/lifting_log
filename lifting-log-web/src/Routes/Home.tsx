import "./Home.css"
import { useAuth } from "../AuthProvider";
import { Navigate } from "react-router";

const Home = () => {
    const { serverUrl, user } = useAuth();
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