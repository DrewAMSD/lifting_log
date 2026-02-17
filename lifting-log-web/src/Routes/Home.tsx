import "./Home.css"
import { useAuth } from "../AuthProvider";

const Home = () => {
    const { serverUrl, user } = useAuth();

    return (
        <div className="home">
            Home Page
            {user?.username}
        </div>
    );
}

export default Home;