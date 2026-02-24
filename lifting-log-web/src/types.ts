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