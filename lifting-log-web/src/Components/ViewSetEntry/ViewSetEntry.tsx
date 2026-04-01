import { JSX } from "react"
import "./ViewSetEntry.css"
import { SetEntry } from "../../types"

type ViewSetEntryProps = {
    sIdx: number
    setEntry: SetEntry
}

const ViewSetEntry = ({ sIdx, setEntry }: ViewSetEntryProps ): JSX.Element => {

    return (
        <div className="view-se-container view-se-container-border">
            <p className="view-se-item">{sIdx + 1}</p>
            {setEntry.weight && <p className="view-se-item">{setEntry.weight}</p>}
            {setEntry.reps && <p className="view-se-item">{setEntry.reps}</p>}
            {setEntry.time && <p className="view-se-item">{setEntry.time}</p>}
        </div>
    );
}

export default ViewSetEntry;