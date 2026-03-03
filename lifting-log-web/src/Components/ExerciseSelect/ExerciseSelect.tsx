import "./ExerciseSelect.css";
import { Exercise, HTTPException } from "../../types";
import { JSX, useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";

type ExerciseElementProps = {
    exercise: Exercise,
    selectExercise: (ex: Exercise) => void
}

type ExerciseSelectProps = {
    exercises: Array<Exercise>,
    cancelSelect: () => void,
    selectExercise: (ex: Exercise) => void
}

const FetchExercises = async (serverUrl: string, token: string): Promise<Array<Exercise>> => {    
    const response: Response = await fetch(serverUrl+"/exercises/me/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer "+token
        }
    })

    const data: unknown = await response.json();

    if (response.ok) {
        const exercises: Array<Exercise> = data as Array<Exercise>;
        return exercises;
    }
    else {
        const httpException: HTTPException = data as HTTPException;
        throw new Error(httpException.detail);
    }
};

const ExerciseElement = ({ exercise, selectExercise }: ExerciseElementProps): JSX.Element => {
    return (
        <div
            className="es-exercise-container"
            onClick={() => selectExercise(exercise)}
        >
            <p>{exercise.name}</p>
            {exercise.primary_muscles && <p className="es-muscle-text">{exercise.primary_muscles}</p>}
        </div>
    );
}

const ExerciseSelect = ({ exercises, cancelSelect, selectExercise }: ExerciseSelectProps): JSX.Element => {
    const { serverUrl, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    const [searchToLower, setSearchToLower] = useState<string>("");
    // muscles fields
    const [isFilteringMuscles, setIsFilteringMuscles] = useState<boolean>(false);
    const [muscles, setMuscles] = useState<Array<string>>([]);
    const [musclesFilter, setMusclesFilter] = useState<Array<string>>([]);

    useEffect(() => {
        const fetchMuscles = async (): Promise<void> => {
            try {
                const token: string = await getToken();

                const response: Response = await fetch(serverUrl+"/muscles/defaults", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    const musclesArr: Array<string> = data as Array<string>;
                    musclesArr.sort((a,b) => a.localeCompare(b));
                    setMuscles(musclesArr);
                }
                else {
                    const httpException: HTTPException = data as HTTPException;
                    throw new Error(httpException.detail);
                }
            }
            catch (error) {
                console.error("Error: ", error);
            }
            finally {
                setIsLoading(false);
            }
        }
        fetchMuscles();
    }, []);

    useEffect(() => {
        setSearchToLower(search.toLowerCase());
    }, [search]);

    return (
    <>
    {isLoading ? (
        <div>Loading...</div>
    ) : (
        <div className="route-container" id="es-container">
            <div className="es-options">
                <button
                    className="es-options-button"
                    onClick={cancelSelect}
                >
                    Cancel
                </button>
                <p className="es-options-text">Exercise Select</p>
                <button
                    className="es-options-button"
                    onClick={() => console.log("Create Exercise")}
                >
                    Create
                </button>
            </div>
            <input 
                type="text"
                className="es-search-bar"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <button
                className="es-muscle-filter-button"
                onClick={() => setIsFilteringMuscles(true)}
            >
                Filter By Muscle
            </button>
            {
                isFilteringMuscles &&
                <div id="es-muscle-filter-list-container">
                    <div className="es-muscle-filter-list-button-container">
                        <button
                            className="es-filter-button"
                            onClick={() => {
                                setMusclesFilter([]);
                                setIsFilteringMuscles(false);
                            }}
                        >
                            Clear
                        </button>
                        <button 
                            className="es-filter-button"
                            onClick={() => setIsFilteringMuscles(false)}
                        >
                            Save
                        </button>
                    </div>
                    <div className="es-muscle-filter-text-container">
                    {
                        muscles.map((muscle, idx) => (
                            <div
                                key={idx}
                                onClick={() => 
                                    setMusclesFilter((prevFilter) => {
                                        const newFilter: Array<string> = [...prevFilter];
                                        const idx: number = newFilter.indexOf(muscle);

                                        if (idx == -1) {
                                            newFilter.push(muscle);
                                        }
                                        else {
                                            newFilter.splice(idx, 1);
                                        }
                                        
                                        return newFilter;
                                    })
                                }
                            >
                                <p 
                                className="es-muscle-filter-text"
                                style={{
                                    backgroundColor: (musclesFilter.includes(muscle) ? "rgb(35, 94, 255)" : "transparent")
                                }}
                                >
                                    {muscle}
                                </p>
                            </div>
                        ))
                    }
                    </div>
                </div>
            }
            <div className="es-exercises-container">
                {
                    exercises
                    .filter((exercise) => {
                        if (!exercise.name.toLowerCase().includes(searchToLower)) {
                            return false;
                        }
                        for (let i: number = 0; i < musclesFilter.length; i++) {
                            if (!exercise.primary_muscles.includes(musclesFilter[i])) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .map((exercise) => (
                        <ExerciseElement 
                            key={exercise.id}
                            exercise={exercise}
                            selectExercise={selectExercise}
                        />
                    ))
                }
            </div>
        </div>
    )}
    </>
    );
};

export { ExerciseSelect, FetchExercises };