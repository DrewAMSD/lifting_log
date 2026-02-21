import { jwtDecode } from "jwt-decode";
import { HTTPException, RefreshToken, User, AccessTokenResponse, TokenPayload, Token } from "./types";
import { Navigate, useNavigate, NavigateFunction } from "react-router";
import { useState, useEffect, createContext, ReactNode, Context, useContext } from "react";

const isExpired = (exp: number): boolean => {
    const now: number = Date.now() / 1000;
    const timeRemaining: number = exp - now;
    
    return timeRemaining <= 0;
};

const getAccessToken = (): Token | null => {
    const tokenString: string | null = localStorage.getItem("accessToken");
    if (!tokenString) {
        return null;
    }
    const token: Token = JSON.parse(tokenString) as Token;
    return token;
}

const getRefreshToken = (): Token | null => {
    const tokenString: string | null = localStorage.getItem("refreshToken");
    if (!tokenString) {
        return null;
    }
    const token: Token = JSON.parse(tokenString) as Token;
    return token;
}

const refreshAccessToken = async (serverUrl: string): Promise<Token | null> => {
    const refreshToken: Token | null = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    const toSend: RefreshToken = {
        refresh_token: refreshToken.token,
        token_type: "bearer"
    }

    let accessToken: Token | null = null;
    
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

            accessToken = {
                token: accessTokenResponse.access_token,
                exp: accessTokenPayload.exp
            }
        } else {
            const httpException: HTTPException = data as HTTPException;
            if (response.status === 404) {
                return null;
            }
            console.error("Error: ", httpException.detail);
        }
    }
    catch (error) {
        console.error("Error: ", error);
    }
    if (!accessToken) {
        return null;
    }
    return accessToken;
}
    
const getUser = async (): Promise<User | null> => {
    const userString: string | null = localStorage.getItem("user");
    if (!userString) {
        return null;
    }

    const user: User = JSON.parse(userString) as User;
    return user;
};

type ReactNodeProps = {
    children: ReactNode
}

type AuthContextType = {
    serverUrl: string,
    user: User | null,
    loading: boolean,
    loginUser: () => Promise<void>,
    logoutUser: () => Promise<void>,
    deleteUser: () => Promise<void>,
    getToken: () => Promise<string>
}

const AuthContext: Context<AuthContextType> = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: ReactNodeProps) => {
    const serverUrl: string = process.env.REACT_APP_SERVER_URL || "http://localhost:8000";
    const navigate: NavigateFunction = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUser = async (): Promise<void> => {
        try {
            const req: User | null = await getUser();

            if (req === null) {
                navigate("/login")
            }
            setUser(req);
        }
        catch (error) {
            console.error("Error fetching user: ", error);
            setUser(null);
            navigate("/login")
        }
        finally {
            setLoading(false);
        }
    };

    const loginUser = async (): Promise<void> => {
        setLoading(true);
        fetchUser();
    };

    const logoutUser = async (): Promise<void> => {
        const refreshToken: Token | null = getRefreshToken();
        if (user && refreshToken) {
            const toSend: RefreshToken = {
                refresh_token: refreshToken.token,
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
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
        setUser(null);
        navigate("/login");
    };

    const deleteUser = async () => {
        try {
            const accessToken: Token | null = getAccessToken();
            if (user && accessToken) {
                const response: Response = await fetch(serverUrl+"/users/me", {
                    method: "DELETE",
                    headers: {
                        "Contetent-Type": "/application/json",
                        "Authorization": "Bearer "+accessToken.token
                    }
                })

                if (!response.ok) {
                    const httpException: HTTPException = await response.json() as HTTPException;
                    console.error("HttpException: ", httpException.detail);
                }
            }
        } 
        catch (error) {
            console.error("Error: ", error);
        } 
        finally {
            navigate("/login");
        }
    };

    const clearData = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        navigate("/login");
    }

    const getToken = async (): Promise<string> => {
        const accessToken: Token | null = getAccessToken();
        if (!accessToken) {
            clearData();
            return "";
        }
        if (isExpired(accessToken.exp)) {
            const refreshToken: Token | null = getRefreshToken();
            if (!refreshToken || isExpired(refreshToken.exp)) {
                clearData();
                return "";
            }
            // refresh token still valid
            const newAccessToken: Token | null = await refreshAccessToken(serverUrl);
            if (!newAccessToken) {
                clearData();const refreshToken: Token | null = getRefreshToken();
                return "";
            }
            localStorage.setItem("accessToken", JSON.stringify(newAccessToken));
            return newAccessToken.token;
        }
        return accessToken.token;
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
    <>
        {loading ? (
            <div>Loading...</div>
        ) : (
            <AuthContext.Provider value={{serverUrl, user, loading, loginUser, logoutUser, deleteUser, getToken }}>
                {children}
            </AuthContext.Provider>
        )}
    </>
    );
}

const useAuth = (): AuthContextType => {
    return useContext(AuthContext);
}

const ProtectedRoute = ({ children }: ReactNodeProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (<div>Loading...</div>);
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    return (<>{children}</>);
}

export { AuthProvider, useAuth, ProtectedRoute }
