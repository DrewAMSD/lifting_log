import "./LoginPage.css"
import { useState, SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { serverUrlProps, HTTPException, User } from "../types";

type CreateUser = {
    username: string,
    password: string,
    email: string,
    full_name: string
}

type CreateUserResponse = {
    username: string
}

type Token = {
    access_token: string,
    token_type: string
}

function LoginPage({ url }: serverUrlProps) {
    const serverUrl: string = url;
    const [login, setLogin] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const navigate = useNavigate();
    // login/register data
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [fullName, setFullName] = useState<string>("");

    const handleLoginSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        
        const loginRequest: URLSearchParams = new URLSearchParams();
        loginRequest.append("username", username);
        loginRequest.append("password", password);

        try {
            const response: Response = await fetch(serverUrl+"/users/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: loginRequest
            })

            const data: unknown = await response.json();

            if (response.ok) {
                const token: Token = data as Token;

                const user: User = {
                    username: username,
                    access_token: token.access_token,
                    token_type: token.token_type
                }

                localStorage.setItem("user", JSON.stringify(user));
                navigate("/home");
            } else {
                const status: number = response.status;
                if (status === 400 || status === 404 || status === 401) {
                    const httpException: HTTPException = data as HTTPException;
                    setMessage(httpException.detail);
                } else {
                    setMessage("Login Error");
                }
            }
        }
        catch (error) {
            console.error("Error: ", error);
        }
    };

    const handleRegisterSubmit = async (event: SubmitEvent) => {
        event.preventDefault();

        const userToCreate: CreateUser = {
            username: username,
            password: password,
            email: email,
            full_name: fullName
        }

        try {
            const response: Response = await fetch(serverUrl+"/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userToCreate)
            })
            
            const data: unknown = await response.json();

            if (response.ok) {
                const userResponse: CreateUserResponse = data as CreateUserResponse;
                
                setMessage("User '"+userResponse.username+"' created");
                setLogin(true);
            } else {
                const httpException: HTTPException = data as HTTPException;
                setMessage(httpException.detail);
            }
        } 
        catch (error) {
            console.error("Error: ", error)
        } 
    };

    return (
        <>
        {login ? (
            <form onSubmit={handleLoginSubmit}>
                <label>
                    Username: 
                    <input 
                        type="text" 
                        onChange={(event) => {setUsername(event.target.value)}} 
                        placeholder="username"
                        required
                    />
                </label>
                <label>
                    Password: 
                    <input 
                        type="password" 
                        onChange={(event) => {setPassword(event.target.value)}}
                        placeholder="Enter your password"  
                        required  
                    />
                </label>
                <input type="submit" value="Login"/>
                <button onClick={() => {setLogin(false)}}>Register Here</button>
            </form>
        ) : (
            <form onSubmit={handleRegisterSubmit}>
                <label>
                    Username: 
                    <input 
                        type="text" 
                        onChange={(event) => {setUsername(event.target.value)}} 
                        placeholder="username"
                        required
                    />
                </label>
                <label>
                    Password: 
                    <input 
                        type="password" 
                        onChange={(event) => {setPassword(event.target.value)}}
                        placeholder="Enter your password"  
                        required  
                    />
                </label>
                <label>
                    Email: 
                    <input 
                        type="text" 
                        onChange={(event) => {setEmail(event.target.value)}}
                        placeholder="email"  
                        required
                    />
                </label>
                <label>
                    Full Name: 
                    <input 
                        type="text" 
                        onChange={(event) => {setFullName(event.target.value)}}
                        placeholder="full name"  
                        required  
                    />
                </label>
                <input type="submit" value="Register"/>
                <button onClick={() => {setLogin(true)}}>Return To Login</button>
            </form>
        )}
        <div className="message">{message}</div>
        </>
    );
}

export default LoginPage;