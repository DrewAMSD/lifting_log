import { jwtDecode } from "jwt-decode";
import { HTTPException, RefreshToken, User, AccessTokenResponse, TokenPayload } from "./types";
import { useNavigate, NavigateFunction } from "react-router";
import { useState, useEffect, createContext, ReactNode, Context, useContext } from "react";

const isExpired = (exp: number): boolean => {
    const now: number = Date.now() / 1000;
    const timeRemaining: number = exp - now;
    
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

type AuthProviderProps = {
    children: ReactNode
}

type AuthContextType = {
    serverUrl: string,
    user: User | null,
    loginUser: () => Promise<void>,
    logout: () => Promise<void>
}

const AuthContext: Context<AuthContextType> = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: AuthProviderProps) => {
    const serverUrl: string = "http://192.168.0.81:8000";
    const navigate: NavigateFunction = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUser = async () => {
        try {
            const req: User | null = await getUser(serverUrl);

            if (req === null) {
                navigate("/login")
            }
            setUser(req);
            setLoading(false);
        }
        catch (error) {
            console.error("Error fetching user: ", error);
            navigate("/login")
        }
    }

    const loginUser = async (): Promise<void> => {
        setLoading(true);
        await fetchUser();
    }

    const logout = async (): Promise<void> => {
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
            setUser(null);
            navigate("/login");
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
    <>
        {
            loading ? (
                <div>Loading...</div>
            ) : (
                <AuthContext.Provider value={{serverUrl, user, loginUser, logout }}>
                    {children}
                </AuthContext.Provider>
            )
        }
    </>
    );
}

const useAuth = (): AuthContextType => {
    return useContext(AuthContext);
}

export { AuthProvider, useAuth }
