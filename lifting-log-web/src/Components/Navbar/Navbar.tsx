import "./Navbar.css";
import { JSX } from "react";
import { NavLink } from "react-router";

function Navbar(): JSX.Element {
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