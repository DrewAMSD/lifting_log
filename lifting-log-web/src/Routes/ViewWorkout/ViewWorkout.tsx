import { JSX, useEffect, useState } from "react"
import "./ViewWorkout.css"
import { useNavigate, NavigateFunction } from "react-router";
import { Workout, SetDistributionEntry, MuscleDistributionEntry } from "../../types";
import { BarChart, Bar, XAxis, YAxis, LabelList, Legend } from 'recharts';
import ViewExerciseEntry from "../../Components/ViewExerciseEntry/ViewExerciseEntry";

type MuscleAndSetDistributionEntry = {
    muscle: string
    primary: number
    secondary: number
    total: number
    percent: number
}

const ViewWorkout = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate: NavigateFunction = useNavigate();
    const [workout, setWorkout] = useState<Workout>({} as Workout);
    const [distribution, setDistribution] = useState<Array<MuscleAndSetDistributionEntry>>([]);

    useEffect(() => {
        const workoutToViewString: string | null = localStorage.getItem("workoutToView");
        if (!workoutToViewString) {
            navigate("/");
            return;
        }


        const workoutToView: Workout = JSON.parse(workoutToViewString) as Workout;
        setWorkout(workoutToView);

        if (!workoutToView.stats) {
            setIsLoading(false);
            return;
        }

        const setDistributionPayload: Array<SetDistributionEntry> = Object.entries(workoutToView.stats.distributions.set_distribution)
            .map(([muscle, sets]) => ({
                muscle: muscle,
                primary: Number(sets["primary"]),
                secondary: Number(sets["secondary"]),
                total: Number(sets["primary"]) + Number(sets["secondary"]) // can potentially use on bar chart if I want to list total
            } as SetDistributionEntry))
            .sort((a, b) => a.muscle.localeCompare(b.muscle));
        
        const muscleDistributionPayload: Array<MuscleDistributionEntry> = Object.entries(workoutToView.stats.distributions.muscle_distribution)
            .map(([muscle, percentage]) => ({
                muscle: muscle,
                percent: percentage
            }) as MuscleDistributionEntry)
            .sort((a, b) => a.muscle.localeCompare(b.muscle));

        const muscleAndSetDistributionPayload: Array<MuscleAndSetDistributionEntry> = setDistributionPayload.map((sEntry, i) => ({
            ...sEntry,
            percent: muscleDistributionPayload[i].percent
        } as MuscleAndSetDistributionEntry))
            .filter((item) => item.total !== 0)
            .sort((a, b) => b.total - a.total);

        setDistribution(muscleAndSetDistributionPayload);

        setIsLoading(false);
    }, []);

    return (
        <>
            {
                isLoading ? (
                    <div>Loading...</div>
                ) : (
                <div className="route-container">
                    <button
                        onClick={() => navigate("/")}
                    >
                        Back
                    </button>
                    <button
                        onClick={() => {
                            localStorage.setItem("workoutState", JSON.stringify(workout));
                            navigate("/workout/working-out");
                        }}
                    >
                        Reopen Workout
                    </button>

                    <div className="workout-view-header-container">
                        <p className="workout-view-name">{workout.name}</p>
                        {workout.description &&
                            <p className="workout-view-description">{workout.description}</p>
                        }
                    </div>

                    {workout.stats && 
                    <>
                        <div id="weekly-overview-summary-container">
                            <div className="weekly-overview-summary-col">
                                <p className="weekly-overview-summary-col-item title">Exercises</p>
                                <p className="weekly-overview-summary-col-item">{workout.stats.exercise_count}</p>
                            </div>
                            <div className="weekly-overview-summary-col">
                                <p className="weekly-overview-summary-col-item title">Sets</p>
                                <p className="weekly-overview-summary-col-item">{workout.stats.sets}</p>
                            </div>
                            <div className="weekly-overview-summary-col">
                                <p className="weekly-overview-summary-col-item title">Reps</p>
                                <p className="weekly-overview-summary-col-item">{workout.stats.reps}</p>
                            </div>
                            <div className="weekly-overview-summary-col">
                                <p className="weekly-overview-summary-col-item title">Volume</p>
                                <p className="weekly-overview-summary-col-item">{workout.stats.volume}</p>
                            </div>
                        </div>
                    
                        <BarChart 
                            data={distribution}
                            layout="vertical"
                            style={{
                                width: "100%",
                                height: 260,
                                maxWidth: 800,
                                aspectRatio: 1.618,
                                marginTop: 10
                            }}
                            responsive
                        >
                            {/* <Legend verticalAlign="top" wrapperStyle={{ top: -10 }} /> */}
                            <XAxis 
                                type="number" 
                                // label={{
                                //     value: 'Muscle Distribution',
                                //     position: 'insideTopLeft',
                                //     dy: 20
                                // }}
                            />
                            <YAxis 
                                type="category"
                                dataKey="muscle"
                                width={80}
                            />

                            <Bar dataKey="percent" stackId="a" fill="#378ADD">
                                {/* <LabelList dataKey="total" position="insideLeft" style={{ fill: "#FFFFFF", fontSize: 11 }} /> */}
                                <LabelList dataKey="percent" position="center" style={{ fill: "#FFFFFF", fontSize: 11 }} formatter={(val) => val+"%"} />
                            </Bar>
                        </BarChart>
                    </>
                    }

                    <div className="view-workout-exercise-entries-container">
                        {
                            workout.exercise_entries.map((exerciseEntry, eIdx) => (
                                <ViewExerciseEntry 
                                    key={eIdx}
                                    eIdx={eIdx}
                                    exerciseEntry={exerciseEntry}
                                />
                            ))
                        }
                    </div>
                </div>
                )
            }
        </>
    )
}

export default ViewWorkout;