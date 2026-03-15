import { SetEntry } from "../../types";
import "./SetEntryComponent.css";
import { JSX } from "react";

type SetEntryProps = {
    setIdx: number
    setEntry: SetEntry
}

const SetEntryComponent = ({ setIdx, setEntry }: SetEntryProps): JSX.Element => {
    
    return (
        <div>
            Set Entry
        </div>
    )
}

export default SetEntryComponent;