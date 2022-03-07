import LoginView from "../Views/LoginView";
import styles from "../Styles/LoginView.module.scss";
import React, {ChangeEvent, ReactElement, SyntheticEvent, useCallback, useRef, useState} from "react";
import {useStateInput, useStateInputWithRegexLimiter} from "../Global/Functions";
import {Link} from "react-router-dom";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {usernameTypingRegex} from "../Global/Regex";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faSpinner} from "@fortawesome/pro-solid-svg-icons";

interface SignupViewControllerProps {
    authViewModel?: AuthenticationViewModel;
}

interface SignupViewControllerState {
    username: string;
    password: string;
    passwordConfirm: string;
    email: string;
    error: string;
    submitting: boolean;
}

export default class SignUpViewController2 extends React.Component<SignupViewControllerProps, SignupViewControllerState> {
    private authViewModel: AuthenticationViewModel;

    constructor(props: SignupViewControllerProps) {
        super(props);

        this.authViewModel = props.authViewModel || new AuthenticationViewModel();

        this.state = {username: "", email: "", password: "", passwordConfirm: "", error: "", submitting: false}
    }

    async doSignup(): Promise<void> {
        const {username, email, password, passwordConfirm} = this.state;

        const isValid = this.authViewModel.validateRegisterFields(username, email, password, passwordConfirm);

        if (isValid.success) {
            this.authViewModel.register(username, email, password).then(signupStatus => {
                if (signupStatus.success) {
                    this.setState({error: "", submitting: false});
                    // Do redirect to email verification page here
                } else {
                    this.setState({error: signupStatus.message, submitting: false});
                }
            });
        } else {
            this.setState({error: isValid.message, submitting: false});
        }
    }

    onSignupSubmit = async (event: SyntheticEvent): Promise<void> => {
        if (this.state.submitting) return;
        this.setState({submitting: true});
        event.preventDefault();

        await this.doSignup();
    }

    render() {
        return <LoginView headerText={"Sign up"} onSubmit={this.onSignupSubmit} submitting={this.state.submitting}>
            {this.state.error !== "" ? <div className={styles.warning_box}><p>{this.state.error}</p></div> : <></>}
            <label htmlFor={"email"}>Email</label>
            <input id={"email"} type="email" placeholder="" autoFocus={true} tabIndex={1} value={this.state.email} onInput={(e: ChangeEvent<HTMLInputElement>) => this.setState({email: e.target.value})}/>
            <label htmlFor={"username"}>Username</label>
            <input id={"username"} className={styles.has_help_text} type="text" placeholder="" tabIndex={2} value={this.state.username} onInput={(e: ChangeEvent<HTMLInputElement>) => this.setState({username: e.target.value})}/>
            <p className={styles.help_text}>a-z, 0-9 and _ allowed. Max 20 characters.</p>
            <label htmlFor={"password"}>Password</label>
            <input id={"password"} className={styles.has_help_text} type="password" placeholder="" tabIndex={3} value={this.state.password} onInput={(e: ChangeEvent<HTMLInputElement>) => this.setState({password: e.target.value})}/>
            <p className={styles.help_text}>Must be at least 8 characters long and contain a number.</p>
            <label htmlFor={"passwordConfirm"}>Confirm Password</label>
            <input id={"passwordConfirm"} className={styles.has_help_text} type="password" placeholder="" tabIndex={4} value={this.state.passwordConfirm} onInput={(e: ChangeEvent<HTMLInputElement>) => this.setState({passwordConfirm: e.target.value})}/>
            <p className={styles.help_text}>Show off your awesome password again!</p>
            <button className={styles.form_button} tabIndex={5} onClick={this.onSignupSubmit}>{this.state.submitting ? <FontAwesomeIcon spin={true} icon={faSpinner} /> : "Sign up"}</button>
            <div className={styles.form_spacer} />
            <Link to={"/"}>Can't log in?</Link>
            <p className={styles.form_spacer_other}>&#x2022;</p>
            <Link to={"/log_in"}>Sign in</Link>
        </LoginView>;
    }

}

export function SignUpViewController(props: {authViewModel?: AuthenticationViewModel}): ReactElement<any,any> | null {
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

        doSignup().then(() => {

        }).catch(() => {

        });
    }

    return <LoginView headerText={"Sign up"} onSubmit={onSignupSubmit} submitting={isSubmitting}>
        {errorMessage !== "" ? <div className={styles.warning_box}><p>{errorMessage}</p></div> : <></>}
        <label htmlFor={"email"}>Email</label>
        <input id={"email"} type="email" placeholder="" autoFocus={true} tabIndex={1} value={email} onInput={setEmail}/>
        <label htmlFor={"username"}>Username</label>
        <input id={"username"} className={styles.has_help_text} type="text" placeholder="" tabIndex={2} value={username} onInput={setUsername}/>
        <p className={styles.help_text}>a-z, 0-9 and _ allowed. Max 20 characters.</p>
        <label htmlFor={"password"}>Password</label>
        <input id={"password"} className={styles.has_help_text} type="password" placeholder="" tabIndex={3} value={password} onInput={setPassword}/>
        <p className={styles.help_text}>Must be at least 8 characters long and contain a number.</p>
        <label htmlFor={"passwordConfirm"}>Confirm Password</label>
        <input id={"passwordConfirm"} className={styles.has_help_text} type="password" placeholder="" tabIndex={4} value={passwordConfirm} onInput={setPasswordConfirm}/>
        <p className={styles.help_text}>Show off your awesome password again!</p>
        <button className={styles.form_button} tabIndex={5} onClick={onSignupSubmit}>{isSubmitting ? <FontAwesomeIcon spin={true} icon={faSpinner} /> : "Sign up"}</button>
        <div className={styles.form_spacer} />
        <Link to={"/"}>Can't log in?</Link>
        <p className={styles.form_spacer_other}>&#x2022;</p>
        <Link to={"/log_in"}>Sign in</Link>
    </LoginView>;
}