import styles from "../Styles/EmailVerification.module.scss";
import loginStyles from "../Styles/LoginView.module.scss";
import React, {ReactElement, SyntheticEvent, useEffect, useState} from "react";
import {useStateInput} from "../Global/Functions";
import { useNavigate} from "react-router-dom";
import EmailVerificationView from "../Views/EmailVerificationView";
import axios from "axios";
import urls from "../Global/Urls";
import {emailRegex} from "../Global/Regex";

axios.defaults.withCredentials = true;

export default function EmailVerificationViewController(): ReactElement<any,any> | null {
    const [email, setEmail] = useState("");
    const [emailUserInput, setEmailUserInput] = useStateInput("");
    const [error, setError] = useState("");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);
    const navigator = useNavigate();

    function checkEmailVerificationStatus(isEffect?: boolean): void {
        axios.post(process.env.REACT_APP_API_URL + "auth/is_email_verified").then(response => {
            // Check success
            if (response.data.success) {
                if (response.data.data.verified === 1) {
                    setIsEmailVerified(true);
                }
                // Only update if successful or initial run (running constantly makes this run too often and also breaks if the user is typing)
                if (isEffect || response.data.data.verified === 1) setEmailUserInput(response.data.data.email);
            } else {
                // Unsuccessful = Not logged in
                navigator(urls.login);
            }
        });
    }

    useEffect(() => {
        checkEmailVerificationStatus(true);

        const interval = setInterval(() => {
            checkEmailVerificationStatus();
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If email is actually updated, update the email in the database
    useEffect(() => {
        if (email !== "") {
            axios.post(process.env.REACT_APP_API_URL + "auth/update_email", {
                email: email
            }).then(response => {
                if (response.data.success) {
                    setEmailUserInput(email);
                    setIsUpdatingEmail(false);
                } else {
                    setError(response.data.message);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    useEffect(() => {
        if (isEmailVerified) navigator(urls.afterRegisterComplete); // Once email is verified, redirect to afterRegisterComplete page
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEmailVerified]);

    function onEmailUpdate(event: SyntheticEvent) {
        event.preventDefault();

        if (!isUpdatingEmail) {
            setIsUpdatingEmail(true);
        } else {
            if (emailUserInput.match(emailRegex) !== null) {
                setIsUpdatingEmail(false);
                setEmail(emailUserInput); // Updates email from user input value
                setError("");
            } else {
                setError("Invalid email address");
            }
        }
    }

    function onContinueOrResend(event: SyntheticEvent) {
        event.preventDefault();
        if (isEmailVerified) {
            navigator(urls.afterRegisterComplete);
        } else {
            // resend email verification
            axios.post(process.env.REACT_APP_API_URL + "auth/verify_email").then(response => {
                if (response.data.success) {
                    setError("");
                    setIsEmailVerificationSent(true);
                    setTimeout(() => {
                        setIsEmailVerificationSent(false);
                    }, 3000);
                } else {
                    setError(response.data.message);
                }
            });
        }
    }

    return <EmailVerificationView>
        <label htmlFor={"email"}>Email</label>
        <input id={"email"} type="email" disabled={!isUpdatingEmail} placeholder="mailer@gmail.com" autoFocus={true} tabIndex={1} value={emailUserInput} onInput={setEmailUserInput}/>
        <div className={styles.two_buttons_holder}>
            <button className={styles.change_email_link} onClick={onEmailUpdate}>{isUpdatingEmail ? "Save Changes" : "Change Email"}</button>
            <button className={styles.change_email_link} onClick={onContinueOrResend} disabled={isEmailVerificationSent}>{isEmailVerified ? "Continue" : (isEmailVerificationSent ? "Email Sent" : "Resend Email")}</button>
        </div>
        {error !== "" ? <div className={loginStyles.warning_box}><p>{error}</p></div> : <></>}
    </EmailVerificationView>;
}