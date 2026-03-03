import "./NotFound.css";
import { JSX } from "react";

const NotFound = (): JSX.Element => {
    return (
        <div className="route-container" id="not-found">
            <p>Error 404</p>
            <p>Page Not Found</p>
        </div>
    );
}

export default NotFound