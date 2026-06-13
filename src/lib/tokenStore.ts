var accesstoken: any = null;

export const tokenStore = () => {
    const setToken = (token: string) => {
        accesstoken = token;
    };

    const getToken = () => {
        return accesstoken;
    };

    const clearToken = () => {
        accesstoken = null;
    }
    return { setToken, getToken, clearToken };
}