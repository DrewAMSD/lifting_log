import "./Home.css"
import { JSX } from "react";
import WorkoutHistoryComponent from "../../Components/WorkoutHistoryComponent/WorkoutHistoryComponent";

const Home = (): JSX.Element => {
    

    return (
        <div className="route-container" id="home">
            <WorkoutHistoryComponent />
        </div>
    );
}

export default Home;