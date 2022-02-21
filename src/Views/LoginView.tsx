import React from 'react';
import styles from "../Styles/LoginView.module.scss";

function LoginView(props: {buttonText: string}) {
    return (
        <div className={styles.login_container}>
            <div className={styles.login_form}>
                <h1>Log in</h1>
                <form>
                    <label htmlFor={"username"}>Username</label>
                    <input id={"username"} type="text" placeholder="" autoFocus={true} />

                    <button className={styles.form_button}>{props.buttonText}</button>
                </form>
            </div>
        </div>
    );
}

export default LoginView;