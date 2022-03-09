import LoginView from "../Views/LoginView";
import styles from "../Styles/LoginView.module.scss";
import React, {ReactElement} from "react";
import {useStateInput} from "../Global/Functions";
import {Link} from "react-router-dom";
import urls from "../Global/Urls";

export default function LoginViewController(): ReactElement<any,any> | null {
    const [username, setUsername] = useStateInput("");
    const [password, setPassword] = useStateInput("");

    return <LoginView onSubmit={() => {}}>
        <label htmlFor={"username"}>Username</label>
        <input id={"username"} type="text" placeholder="" autoFocus={true} tabIndex={1} value={username} onInput={setUsername}/>
        <label htmlFor={"password"}>Password</label>
        <input id={"password"} type="password" placeholder="" tabIndex={2} value={password} onInput={setPassword}/>
        <button className={styles.form_button} tabIndex={3}>Log In</button>
        <div className={styles.form_spacer} />
        <Link to={"/"}>Can't log in?</Link>
        <p className={styles.form_spacer_other}>&#x2022;</p>
        <Link to={urls.register}>Join WhoAmI</Link>
    </LoginView>;
}