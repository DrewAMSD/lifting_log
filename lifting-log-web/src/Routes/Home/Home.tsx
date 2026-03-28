import "./Home.css"
import { JSX } from "react";
import WorkoutHistoryComponent from "../../Components/WorkoutHistoryComponent/WorkoutHistoryComponent";
import WeeklyOverview from "../../Components/WeeklyOverview/WeeklyOverview"

const Home = (): JSX.Element => {
    

    return (
        <div className="route-container" id="home">
            <p>Home Page</p>
            <WeeklyOverview />
            <WorkoutHistoryComponent />
        </div>
    );
}

export default Home;