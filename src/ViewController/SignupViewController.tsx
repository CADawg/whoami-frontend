import LoginView from "../Views/LoginView";
import styles from "../Styles/LoginView.module.scss";
import React, {ReactElement, SyntheticEvent, useState} from "react";
import {useStateInput, useStateInputWithRegexLimiter} from "../Global/Functions";
import {Link} from "react-router-dom";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {usernameTypingRegex} from "../Global/Regex";

export default function SignUpViewController(props: {authViewModel?: AuthenticationViewModel}): ReactElement<any,any> | null {
    const [username, setUsername] = useStateInputWithRegexLimiter("", usernameTypingRegex);
    const [email, setEmail] = useStateInput("");
    const [password, setPassword] = useStateInput("");
    const [passwordConfirm, setPasswordConfirm] = useStateInput("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const authViewModel = props.authViewModel || new AuthenticationViewModel();

    async function onSignupSubmit(event: SyntheticEvent): Promise<void> {
        event.preventDefault();
        console.log("clicked");
        if (isSubmitting) return;
        setIsSubmitting(true);

        const isValid = authViewModel.validateRegisterFields(username, email, password, passwordConfirm);

        if (isValid.success) {
            await authViewModel.register(username, email, password, passwordConfirm);
            setErrorMessage("");
        } else {
            setErrorMessage(isValid.message);
        }

        setIsSubmitting(false);
    }

    return <LoginView headerText={"Sign up"} onSubmit={onSignupSubmit}>
        {errorMessage !== "" ? <div className={styles.warning_box}><p>{errorMessage}</p></div> : <></>}
        <label htmlFor={"email"}>Email</label>
        <input id={"email"} type="email" placeholder="" disabled={isSubmitting} autoFocus={true} tabIndex={1} value={email} onInput={setEmail}/>
        <label htmlFor={"username"}>Username</label>
        <input id={"username"} className={styles.has_help_text} disabled={isSubmitting} type="text" placeholder="" tabIndex={2} value={username} onInput={setUsername}/>
        <p className={styles.help_text}>a-z, 0-9 and _ allowed. Max 20 characters.</p>
        <label htmlFor={"password"}>Password</label>
        <input id={"password"} className={styles.has_help_text} disabled={isSubmitting} type="password" placeholder="" tabIndex={3} value={password} onInput={setPassword}/>
        <p className={styles.help_text}>Must be at least 8 characters long and contain a number.</p>
        <label htmlFor={"passwordConfirm"}>Confirm Password</label>
        <input id={"passwordConfirm"} className={styles.has_help_text} disabled={isSubmitting} type="password" placeholder="" tabIndex={4} value={passwordConfirm} onInput={setPasswordConfirm}/>
        <p className={styles.help_text}>Show off your awesome password again!</p>
        <button className={styles.form_button} tabIndex={5} disabled={isSubmitting} onClick={onSignupSubmit}>Sign up</button>
        <div className={styles.form_spacer} />
        <Link to={"/"}>Can't log in?</Link>
        <p className={styles.form_spacer_other}>&#x2022;</p>
        <Link to={"/"}>Sign in</Link>
    </LoginView>;
}