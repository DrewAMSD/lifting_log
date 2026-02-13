import { User } from "./types";
// import { jwtDecode, JwtPayload } from "jwt-decode";

const getUser = (): User | null => {
    const userString: string | null = localStorage.getItem("user");
    if (userString === null) {
        return null;
    }

    const user: User = JSON.parse(userString) as User;
    if (isExpired(user.access_token.exp)) {
	    localStorage.removeItem("user");
	    return null;
    }

    return user;
}

const isExpired = (exp: number): boolean => {
    const now: number = Date.now() / 1000;
    const timeRemaining: number = exp - now;
    
    return timeRemaining <= 0;
}


export { getUser };
