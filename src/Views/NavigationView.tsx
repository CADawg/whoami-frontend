import React, {useEffect, useState} from 'react';
import styles from '../Styles/NavigationView.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCloudQuestion} from '@fortawesome/pro-solid-svg-icons';
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {Link} from "react-router-dom";
import urls from "../Global/Urls";

function NavigationView(props: {authViewModel?: AuthenticationViewModel}) {
    const [loggedIn, setLoggedIn] = useState(false);
    const authViewModel = props.authViewModel || new AuthenticationViewModel();

    function authStatusUpdate(loggedIn: boolean) {
        setLoggedIn(loggedIn);
    }

    useEffect(() => {
        authViewModel.authEvents.on("loginStatusUpdate", authStatusUpdate);
        return () => {
            authViewModel.authEvents.off("loginStatusUpdate", authStatusUpdate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <nav className={styles.bar}>
            <p className={styles.brand}>
                <FontAwesomeIcon icon={faCloudQuestion} />
            </p>

            {loggedIn ? <div className={styles.auth_panel}>
                <Link to={urls.home}>Vault</Link>
                <Link to={urls.recovery}>Recovery</Link>
            </div> : null}

            <div className={styles.nav_bar_spacer} />

            <div className={styles.auth_panel}>
                {loggedIn ? <Link to={urls.logout}>Log out</Link>: <>
                    <Link to={urls.login}>Log In</Link>
                    <Link to={urls.register} className={styles.highlighted_button}>Sign up</Link>
                </>}
            </div>
        </nav>
    );
}

export default NavigationView;