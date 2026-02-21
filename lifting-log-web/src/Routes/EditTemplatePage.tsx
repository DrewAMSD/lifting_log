import "./EditTemplatePage.css";
import { useEffect, useState } from "react";
import { WorkoutTemplate, ExerciseTemplate, SetTemplate } from "../types";
import { NavigateFunction, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";

type ExerciseTemplateProps = {
    exIdx: number,
    exerciseTemplate: ExerciseTemplate
}

type SetTemplateProps = {
    setIdx: number,
    setTemplate: SetTemplate,
    isReps: boolean,
    isRepRange: boolean,
    isTimeRange: boolean
}

const SetTemplateElement = ({ setIdx, setTemplate, isReps, isRepRange, isTimeRange }: SetTemplateProps) => {
    return (
        <div 
        className="edit-template-set-row">
            <p className="edit-template-set-row-item">{setIdx+1}</p>
            {isReps && 
            <input 
            type="number"
            className="edit-template-set-row-item input-default" 
            value={""+setTemplate.reps}
            placeholder="0"
            />}
            {isRepRange && 
            <p className="edit-template-set-row-item">{setTemplate.rep_range_start}-{setTemplate.rep_range_end}</p>}
            {isTimeRange && <p className="edit-template-set-row-item">{setTemplate.time_range_start}-{setTemplate.time_range_end}</p>}
            <button className="delete-button">D</button>
        </div>
    );
}

const ExerciseTemplateElement = ({ exIdx, exerciseTemplate }: ExerciseTemplateProps) => {
    const [isReps, setIsReps] = useState<boolean>(exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].reps ? true : false) : false);
    const [isRepRange, setIsRepRange] = useState<boolean>(exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].rep_range_start ? true : false) : false);
    const [isTimeRange, setIsTimeRange] = useState<boolean>(exerciseTemplate.set_templates[0] ? (exerciseTemplate.set_templates[0].time_range_start ? true : false) : false);

    return (
        <div
        className="edit-template-exercise"
        >
            <div className="edit-template-exercise-header">
                <p className="edit-template-exercise-name">{exIdx+1}. </p>
                <p className="edit-template-exercise-name">{exerciseTemplate.exercise_name}</p>
                <button className="delete-button">D</button>
            </div>
            <input
            type="text"
            className="input-default routine-note"
            placeholder="Routine Note"
            />
            <hr className="line"/>
            <div className="edit-template-set">
                <div className="edit-template-set-row">
                    <p className="edit-template-set-row-item">Set</p>
                    {isReps && <p className="edit-template-set-row-item">Reps</p>}
                    {isRepRange && <p className="edit-template-set-row-item">Rep Range</p>}
                    {isTimeRange && <p className="edit-template-set-row-item">Time Range</p>}
                    {!isReps && <button className="set-add-option" onClick={() => {setIsReps(true)}}>+Reps</button>}
                    {!isRepRange && <button className="set-add-option" onClick={() => {setIsRepRange(true)}}>+Rep Range</button>}
                    {!isTimeRange && <button className="set-add-option" onClick={() => {setIsTimeRange(true)}}>+Time Range</button>}
                </div>
                <hr className="line line-light"/>
                {exerciseTemplate.set_templates.map((setTemplate, setIdx) => (
                    <SetTemplateElement key={setIdx} setIdx={setIdx} setTemplate={setTemplate} isReps={isReps} isRepRange={isRepRange} isTimeRange={isTimeRange}/>
                ))}
                <button 
                className="add-set-button"
                >
                    Add Set
                </button>
            </div>
        </div>
    );
}

const EditTemplatePage = () => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate>({name: "", exercise_templates: []} as WorkoutTemplate);

    useEffect(() => {
        const templateToEditString: string | null = localStorage.getItem("templateToEdit");
        if (templateToEditString) {
            const initTemplate: WorkoutTemplate = JSON.parse(templateToEditString) as WorkoutTemplate;
            setWorkoutTemplate(initTemplate);
        }
        setIsLoading(false);
    }, []);

    return (
    <>
        {isLoading ? (
            <div>Loading...</div>
        ) : (
        <>
            <div className="edit-template-options">
            <button 
            className="edit-template-options-button"
            onClick={() => {
                localStorage.removeItem("templateToEdit");
                navigate("/workout");
            }}
            >
                Cancel
            </button>
            <p className="edit-template-options-text">Edit Workout Template</p>
            <button 
            className="edit-template-options-button"
            >
                Save
            </button>
            </div>
            <div className="edit-template-form">
                <input 
                    type="text"
                    className="edit-template-title input-default"
                    onChange={
                        (event) => {setWorkoutTemplate((prevWorkoutTemplate) => ({
                            ...prevWorkoutTemplate, 
                            name: event.target.value
                        }))}
                    }
                    placeholder="Template Name"
                    value={workoutTemplate.name}
                    required
                />
                <hr className="line"/>
                {
                    workoutTemplate.exercise_templates.map((exerciseTemplate, exIdx) => (
                        <ExerciseTemplateElement key={exIdx} exIdx={exIdx} exerciseTemplate={exerciseTemplate}/>
                    ))
                }
                <button 
                className="edit-template-add-exercise-button"
                >
                    Add Exercise
                </button>
            </div>
        </>
        )}
    </>
    );
}


export default EditTemplatePage;