export interface User {
    user_id: string;
}


export interface IUserSignup {
    username: string;
    email: string;
    password: string;
}

export interface IUserLogin {
    email: string;
    password: string;
}