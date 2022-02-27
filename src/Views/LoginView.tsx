import React, {SyntheticEvent} from 'react';
import styles from "../Styles/LoginView.module.scss";
import {Children} from "../Global/Types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCloudQuestion} from '@fortawesome/pro-solid-svg-icons';

function LoginView(props: {children: Children}) {
    const preventDefault = (e: SyntheticEvent) => {e.preventDefault(); return false;}

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_head}>
                <FontAwesomeIcon icon={faCloudQuestion}/>
                <h1 className={styles.login_form_head_text}>WhoAmI</h1>
            </div>
            <div className={styles.login_form}>

                <p>Log in to continue to <strong>WhoAmI</strong></p>
                <form onSubmit={preventDefault}>
                    {props.children}
                </form>
            </div>
        </div>
    );
}

export default LoginView;