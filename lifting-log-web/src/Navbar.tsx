import "./Navbar.css";
import { NavLink } from "react-router";

function Navbar() {
    // TODO: add icons right above text on each of these links
    return (
        <div className="navbar">
            <NavLink className="link" to="/home">
                Home
            </NavLink>
            <NavLink className="link" to="/workout">
                Workout
            </NavLink>
            <NavLink className="link" to="/settings">
                Settings
            </NavLink>
        </div>
    );
}

export default Navbar