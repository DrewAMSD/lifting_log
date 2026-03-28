import "./WorkoutHistoryComponent.css"
import React, { JSX, useState, useEffect } from "react"
import { useAuth } from "../../AuthProvider";
import { Workout, HTTPException } from "../../types";
import WorkoutPreviewCard from "../WorkoutPreviewCard/WorkoutPreviewCard";
import { NavigateFunction, useNavigate } from "react-router";

const defaultFromFilter: number = 0;
const defaultToFilter: number = 33331122;

const WorkoutHistoryComponent = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const navigate: NavigateFunction = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const [workouts, setWorkouts] = useState<Array<Workout>>([]);
    // filter fields
    const [fromFilter, setFromFilter] = useState<number>(defaultFromFilter);
    const [toFilter, setToFilter] = useState<number>(defaultToFilter);

    const convertDateStringToNumber = (dateString: string): number => {
        let newDate: number = -1;
        try {
            const split: Array<string> = dateString.split('-');

            newDate = (parseInt(split[0]) * 10000) + (parseInt(split[1]) * 100) + parseInt(split[2]);
        }
        catch (error) {
            setMessage("Error parsing date");
            return -1;
        }

        return newDate;
    };

    const handleFromFilterChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (!event.target.value) {
            setFromFilter(defaultFromFilter);
            return;
        }
        
        const newFilter: number = convertDateStringToNumber(event.target.value);
        if (newFilter === -1) {
            return;
        }

        setFromFilter(newFilter);
    };

    const handleToFilterChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (!event.target.value) {
            setToFilter(defaultToFilter);
            return;
        }
        
        const newFilter: number = convertDateStringToNumber(event.target.value);
        if (newFilter === -1) {
            return;
        }

        setToFilter(newFilter);
    };

    useEffect(() => {
        const fetchWorkouts = async(): Promise<void> => {
            try {
                const token: string = await getToken();

                const response: Response = await fetch(serverUrl+"/workouts/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer "+token
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    const workoutsPayload: Array<Workout> = data as Array<Workout>;
                    workoutsPayload.sort((a, b) => b.date - a.date); // sort from most recent date descending
                    setWorkouts(workoutsPayload);
                } else {
                    const httpException: HTTPException = data as HTTPException;

                    setMessage("Failed to fetch workouts");
                    console.error(httpException.detail);
                }
            }
            catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();
    }, []);

    return (
    <div id="wh-container">
        {
            isLoading ? (
                <div>Loading...</div>
            ) : (
            <>
                <p className="workout-history-header">Workout History:</p>
                {/* TODO: add filtering by date (potentially other workout attributes as well) */}
                {message && <p>{message}</p>}
                <div id="workout-history-date-filter-container">
                    <p className="date-filter-tag">From: </p>
                    <input className="date-filter-input" aria-label="Date" type="date" onChange={handleFromFilterChange}/>
                    <p className="date-filter-tag">To: </p>
                    <input className="date-filter-input" aria-label="Date" type="date" onChange={handleToFilterChange}/>
                </div>
                {
                    workouts.length === 0 ? (
                    <>
                        <p>No Workouts on Record</p>
                        <p>Go to the Workout Tab to get Started</p>
                    </>
                    ) : (
                        workouts
                        .filter(workout => (fromFilter <= workout.date && workout.date <= toFilter))
                        .map(workout => (
                            <WorkoutPreviewCard
                                key={workout.id} 
                                workout={workout}
                                onSelect={() => {
                                    localStorage.setItem("workoutToView", JSON.stringify(workout));
                                    navigate("/workout/view-workout");
                                }}
                            />
                        ))
                    )
                }
            </>
            )
        }
    </div>
    )
}

export default WorkoutHistoryComponent;