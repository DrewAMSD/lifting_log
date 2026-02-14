import { jwtDecode } from "jwt-decode";
import { HTTPException, RefreshToken, User, AccessTokenResponse, TokenPayload } from "./types";
// import { jwtDecode, JwtPayload } from "jwt-decode";

const isExpired = (exp: number): boolean => {
    const now: number = Date.now() / 1000;
    const timeRemaining: number = exp - now;
    
    return timeRemaining <= 0;
};

const refreshAccessToken = async (serverUrl: string, user: User, refreshToken: string) => {
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
            console.error("Error: ", httpException.detail);
        }
    }
    catch (error) {
        console.error("Error: ", error);
    }
}
    
const getUser = (serverUrl: string): User | null => {
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
        refreshAccessToken(serverUrl, user, user.refresh_token.token);
    }

    return user;
};


export { getUser };
