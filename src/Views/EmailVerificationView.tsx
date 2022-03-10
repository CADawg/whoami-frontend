import React from 'react';
import styles from "../Styles/LoginView.module.scss";
import {Children} from "../Global/Types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCloudQuestion} from '@fortawesome/pro-solid-svg-icons';

function LoginView(props: {children: Children, hideInstructions?: boolean}) {

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_head}>
                <FontAwesomeIcon icon={faCloudQuestion}/>
                <h1 className={styles.login_form_head_text}>WhoAmI</h1>
            </div>
            <div className={styles.login_form}>

                {props.hideInstructions? <></> : <p>Please click the link in the email we have just sent to confirm your email address.</p>}
                <form>
                    {props.children}
                </form>
            </div>
        </div>
    );
}

export default LoginView;