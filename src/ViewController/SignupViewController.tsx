import LoginView from "../Views/LoginView";
import styles from "../Styles/LoginView.module.scss";
import React, {ReactElement, SyntheticEvent, useRef, useState} from "react";
import {useStateInput, useStateInputWithRegexLimiter} from "../Global/Functions";
import {Link} from "react-router-dom";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {usernameTypingRegex} from "../Global/Regex";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faSpinner} from "@fortawesome/pro-solid-svg-icons";

export default function SignUpViewController(props: {authViewModel?: AuthenticationViewModel}): ReactElement<any,any> | null {
    const [username, setUsername] = useStateInputWithRegexLimiter("", usernameTypingRegex);
    const [email, setEmail] = useStateInput("");
    const [password, setPassword] = useStateInput("");
    const [passwordConfirm, setPasswordConfirm] = useStateInput("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const authViewModel = useRef(props.authViewModel || new AuthenticationViewModel());

    if (isSubmitting) console.log("Submitting");

    async function doSignup(): Promise<void> {
        const isValid = authViewModel.current.validateRegisterFields(username, email, password, passwordConfirm);

        if (isValid.success) {
            authViewModel.current.register(username, email, password).then(signupStatus => {
                if (signupStatus.success) {
                    setErrorMessage("");
                    // Do redirect to email verification page here
                } else {
                    setErrorMessage(signupStatus.message);
                }
            });
        } else {
            setErrorMessage(isValid.message);
        }
    }

    function onSignupSubmit(event: SyntheticEvent): void {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        // This is so incredibly dumb.
        // React refuses to update the state if this is called synchronously.
        // So we have to wait a bit before calling the function.
        // Otherwise, the user can't see that the form has been submitted and may try to submit again.
        setTimeout(() => {
            doSignup().then(() => {
                setIsSubmitting(false);
            }).catch(() => {
                setIsSubmitting(false);
            });
        }, 100);
        // Although, it does make the UI slightly nicer, as it doesn't immediately hit you with errors.
    }

    return <LoginView headerText={"Sign up"} onSubmit={onSignupSubmit} disabled={isSubmitting}>
        <label htmlFor={"email"}>Email</label>
        <input id={"email"} type="email" disabled={isSubmitting} placeholder="" autoFocus={true} tabIndex={1} value={email} onInput={setEmail}/>
        <label htmlFor={"username"}>Username</label>
        <input id={"username"} className={styles.has_help_text} disabled={isSubmitting}  type="text" placeholder="" tabIndex={2} value={username} onInput={setUsername}/>
        <p className={styles.help_text}>a-z, 0-9 and _ allowed. Max 20 characters.</p>
        <label htmlFor={"password"}>Password</label>
        <input id={"password"} className={styles.has_help_text} disabled={isSubmitting}  type="password" placeholder="" tabIndex={3} value={password} onInput={setPassword}/>
        <p className={styles.help_text}>Must be at least 8 characters long and contain a number.</p>
        <label htmlFor={"passwordConfirm"}>Confirm Password</label>
        <input id={"passwordConfirm"} className={styles.has_help_text} disabled={isSubmitting}  type="password" placeholder="" tabIndex={4} value={passwordConfirm} onInput={setPasswordConfirm}/>
        <p className={styles.help_text}>Show off your awesome password again!</p>
        <button className={styles.form_button} tabIndex={5} disabled={isSubmitting} onClick={onSignupSubmit}>{isSubmitting ? <FontAwesomeIcon spin={true} icon={faSpinner} /> : "Sign up"}</button>
        {errorMessage !== "" ? <div className={styles.warning_box}><p>{errorMessage}</p></div> : <></>}
        <div className={styles.form_spacer} />
        <Link to={"/"}>Can't log in?</Link>
        <p className={styles.form_spacer_other}>&#x2022;</p>
        <Link to={"/log_in"}>Sign in</Link>
    </LoginView>;
}