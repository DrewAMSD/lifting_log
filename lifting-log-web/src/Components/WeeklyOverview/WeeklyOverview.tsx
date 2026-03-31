import { JSX, useEffect, useState } from "react";
import "./WeeklyOverview.css";
import { useAuth } from "../../AuthProvider";
import { HTTPException, SetDistributionEntry, WorkoutStats } from "../../types";
import { BarChart, Bar, XAxis, YAxis, LabelList, Legend } from 'recharts';

const WeeklyOverview = (): JSX.Element => {
    const { serverUrl, user, getToken } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({} as WorkoutStats);
    const [setDistribution, setSetDistribution] = useState<Array<SetDistributionEntry>>([]);

    useEffect(() => {
        const fetchWorkoutStats = async (): Promise<void> => {
            try {
                const token: string = await getToken();

                const date: Date = new Date();
                const dayOfWeek: number = (date.getDay() || 7) - 1; // 0 is for sunday -> 7, now we have 0 = Monday, ..., 6 = Sunday
                date.setHours(-24 * dayOfWeek);
                const year: number = date.getFullYear();
                const month: number = date.getMonth() + 1;
                const day: number = date.getDate();
                const dateInteger: number = (year * 10000) + (month * 100) + day;

                const response: Response = await fetch(serverUrl+"/workouts/me/stats?start_date="+dateInteger, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer "+token
                    }
                })

                const data: unknown = await response.json();

                if (response.ok) {
                    const workoutStatsPayload: WorkoutStats = data as WorkoutStats;
                    
                    // convert set distribution to our format
                    const setDistributionPayload: Array<SetDistributionEntry> = Object.entries(workoutStatsPayload.distributions.set_distribution)
                        .map(([muscle, sets]) => ({
                            muscle: muscle,
                            primary: Number(sets["primary"]),
                            secondary: Number(sets["secondary"]),
                            total: Number(sets["primary"]) + Number(sets["secondary"]) // can potentially use on bar chart if I want to list total
                        } as SetDistributionEntry))
                        .sort((a, b) => a.muscle.localeCompare(b.muscle));

                    setWorkoutStats(workoutStatsPayload);
                    setSetDistribution(setDistributionPayload);
                }
                else {
                    const httpException: HTTPException = data as HTTPException;
                    throw Error(httpException.detail);
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setIsLoading(false);
            }
        }

        fetchWorkoutStats();
    }, []);

    return (
    <>
        {
            isLoading ? (
                <div>Loading...</div>
            ) : (
            <div id="weekly-overview-container">
                <p id="weekly-overview-header">Weekly Overview</p>

                <div id="weekly-overview-summary-container">
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Workouts</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.workout_count}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Exercises</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.exercise_count}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Sets</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.sets}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Reps</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.reps}</p>
                    </div>
                    <div className="weekly-overview-summary-col">
                        <p className="weekly-overview-summary-col-item title">Volume</p>
                        <p className="weekly-overview-summary-col-item">{workoutStats.volume}</p>
                    </div>
                </div>


                <BarChart 
                    data={setDistribution}
                    style={{
                        width: "100%",
                        height: 300,
                        maxWidth: 800,
                        aspectRatio: 1.618
                    }}
                    responsive
                >
                    <Legend verticalAlign="top" />
                    <XAxis dataKey="muscle" angle={-90} height={100} dy={45}/>
                    <YAxis 
                        width={40}
                        label={{
                            position: 'insideTopLeft',
                            value: 'Total Sets',
                            angle: -90,
                            dy: 140
                        }} 
                    />

                    <Bar dataKey="primary" stackId="a" fill="#378ADD">
                        <LabelList dataKey="primary" position="insideTop" style={{ fill: "#000000", fontSize: 11 }} />
                    </Bar>
                    <Bar dataKey="secondary" stackId="a" fill="#9FE1CB">
                        <LabelList dataKey="secondary" position="insideTop" style={{ fill: "#000000", fontSize: 11 }} />
                        {/* <LabelList dataKey="total" position="top" style={{ fill: "white", fontSize: 11 }} /> */}
                    </Bar>
                </BarChart>
            </div>
            )
        }
    </>
    )
};

export default WeeklyOverview;