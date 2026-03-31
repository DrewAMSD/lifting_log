export type HTTPException = {
  detail: string
};

export type TokenResponse = {
  access_token: string,
  refresh_token: string,
  token_type: string
};

export type AccessTokenResponse = {
  access_token: string,
  token_type: string
}

export type TokenPayload = {
  sub: string,
  exp: number // in seconds
};

export type Token = {
  token: string,
  exp: number // in seconds
};

export type RefreshToken = {
  refresh_token: string,
  token_type: string
}

export type User = {
  username: string
};

export type SetTemplate = {
  reps?: number
  rep_range_start?: number
  rep_range_end?: number
  time?: string
}

export type ExerciseTemplate = {
  exercise_id: number
  exercise_name: string
  routine_note: string
  set_templates: Array<SetTemplate>
}

export type WorkoutTemplate = {
  id?: number,
  name: string,
  username?: string,
  exercise_templates: Array<ExerciseTemplate>
}

export type Exercise = {
  id: number,
  name: string,
  username?: string,
  primary_muscles: Array<string>,
  secondary_muscles?: Array<string>,
  description?: string,
  weight: boolean,
  reps: boolean,
  time: boolean
}

export type ExerciseToAdd = {
  id?: number,
  name: string,
  username?: string,
  primary_muscles: Array<string>,
  secondary_muscles?: Array<string>,
  description?: string,
  weight: boolean,
  reps: boolean,
  time: boolean
}

export type SetDistributionEntry = {
  muscle: string
  primary: number
  secondary: number
  total: number
}

export type MuscleDistributionEntry = {
    muscle: string
    percent: number
}

export type WorkoutStats = {
  workout_count: number
  exercise_count: number
  sets: number
  reps: number
  volume: number
  distributions: {
    set_distribution: Record<string, Record<string, number>>,
    muscle_distribution: Record<string, number>
  }
}

export type SetEntry = {
  previous?: string
  weight?: number
  reps?: number
  time?: string
  placeholder?: string
  submitted?: boolean
}

export type ExerciseEntry = {
  exercise_id: number
  exercise_name: string
  description?: string
  routine_note?: string
  set_entries: Array<SetEntry>
}

export type Workout = {
  id?: number
  name: string
  description?: string
  date: number
  start_time: string
  duration: string
  stats?: WorkoutStats
  exercise_entries: Array<ExerciseEntry>
}