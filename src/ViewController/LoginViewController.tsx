import LoginView from "../Views/LoginView";
import styles from "../Styles/LoginView.module.scss";
import React, {ReactElement, SyntheticEvent, useEffect, useRef, useState} from "react";
import {useStateInput} from "../Global/Functions";
import {Link, useNavigate} from "react-router-dom";
import urls from "../Global/Urls";
import store from "store/dist/store.modern";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";

export default function LoginViewController(props: {authViewModel?: AuthenticationViewModel}): ReactElement<any,any> | null {
    const [username, setUsername] = useStateInput(store.get("username") || "");
    const [password, setPassword] = useStateInput("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const authViewModel = props.authViewModel || new AuthenticationViewModel();
    const isUsernameFilled = useRef(username !== "");

    function onSubmit(event: SyntheticEvent): void {
        event.preventDefault();
        authViewModel.login(username, password).then(response => {
            if (response !== false) {
                if (response.emailVerified > 0) navigate(urls.afterLogin);
                else navigate(urls.emailVerify);
            } else {
                setError("Invalid username or password");
            }
        });
    }

    useEffect(() => {
        if (authViewModel.isLoggedIn()) navigate(urls.afterLogin);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function authStatusUpdate(loggedIn: boolean) {
        if (loggedIn) navigate(urls.afterLogin);
    }

    useEffect(() => {
        authViewModel.authEvents.on("loginStatusUpdate", authStatusUpdate);
        return () => {
            authViewModel.authEvents.off("loginStatusUpdate", authStatusUpdate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <LoginView onSubmit={onSubmit}>
        <label htmlFor={"username"}>Username</label>
        <input id={"username"} type="text" placeholder="" autoFocus={!isUsernameFilled.current} tabIndex={1} value={username} onInput={setUsername}/>
        <label htmlFor={"password"}>Password</label>
        <input id={"password"} type="password" autoFocus={isUsernameFilled.current} placeholder="" tabIndex={2} value={password} onInput={setPassword}/>
        <button className={styles.form_button} onClick={onSubmit} tabIndex={3}>Log In</button>
        {error !== "" ? <div className={styles.warning_box}><p>{error}</p></div> : <></>}
        <div className={styles.form_spacer} />
        <Link to={"/"}>Can't log in?</Link>
        <p className={styles.form_spacer_other}>&#x2022;</p>
        <Link to={urls.register}>Join WhoAmI</Link>
    </LoginView>;
}