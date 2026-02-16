import { jwtDecode } from "jwt-decode";
import { HTTPException, RefreshToken, User, AccessTokenResponse, TokenPayload } from "./types";

const isExpired = (exp: number): boolean => {
    const now: number = Date.now() / 1000;
    const timeRemaining: number = exp - now;

    console.log(timeRemaining);
    
    return timeRemaining <= 0;
};

const refreshAccessToken = async (serverUrl: string, user: User, refreshToken: string): Promise<boolean> => {
    const toSend: RefreshToken = {
        refresh_token: refreshToken,
        token_type: "bearer"
    }
    
    try {
        const response: Response = await fetch(serverUrl+"/users/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(toSend)
        });

        const data: unknown = await response.json();

        if (response.ok) {
            const accessTokenResponse: AccessTokenResponse = data as AccessTokenResponse;
            const accessTokenPayload: TokenPayload = jwtDecode<TokenPayload>(accessTokenResponse.access_token);

            user.access_token = {
                token: accessTokenResponse.access_token,
                exp: accessTokenPayload.exp
            }
        } else {
            const httpException: HTTPException = data as HTTPException;
            if (response.status === 404) {
                return false;
            }
            console.error("Error: ", httpException.detail);
        }
    }
    catch (error) {
        console.error("Error: ", error);
    }
    return true;
}
    
const getUser = async (serverUrl: string): Promise<User | null> => {
    const userString: string | null = localStorage.getItem("user");
    if (userString === null) {
        return null;
    }

    const user: User = JSON.parse(userString) as User;
    if (isExpired(user.access_token.exp)) {
	    if (isExpired(user.refresh_token.exp)) {
            localStorage.removeItem("user");
	        return null;
        }
        // refresh token still valid
        const refreshed: boolean = await refreshAccessToken(serverUrl, user, user.refresh_token.token);
        if (!refreshed) {
            localStorage.removeItem("user");
            return null;
        }
    }

    return user;
};

const logoutUser = async (serverUrl: string) => {
    const user: User | null = await getUser(serverUrl);
    if (user) {
        const toSend: RefreshToken = {
            refresh_token: user.refresh_token.token,
            token_type: "bearer"
        }

        const response = await fetch(serverUrl+"/users/refresh", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(toSend)
        });

        if (!response.ok) {
            const data: unknown = await response.json();
            const httpException: HTTPException = data as HTTPException
            console.error("Error: ", httpException.detail)
        }
        localStorage.removeItem("user");
    }
}

export { getUser, logoutUser };
