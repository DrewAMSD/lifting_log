import { User } from "./types";

const getUser = (): User | null => {
    const userString: string | null = localStorage.getItem("user");
    if (userString === null) {
        return null;
    }
    const user: User = JSON.parse(userString) as User;
    return user;
}


export { getUser };