

let logoutHandler : (()=> void) | null = null;


export const registerLogoutHandler = (handler:()=>void)=>{
    logoutHandler = handler;
}

export const triggerLogout = ()=>{
    if(logoutHandler){
        logoutHandler();
    }
}