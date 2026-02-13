import { User } from "./types";
// import { jwtDecode, JwtPayload } from "jwt-decode";

const getUser = (): User | null => {
    const userString: string | null = localStorage.getItem("user");
    if (userString === null) {
        return null;
    }
    const user: User = JSON.parse(userString) as User;
    return user;
}

// const isTokenExpired = (token: Token): boolean => {
//     return true;
// }


export { getUser };