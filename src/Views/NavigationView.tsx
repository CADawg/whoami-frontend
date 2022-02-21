import React from 'react';
import styles from '../Styles/NavigationView.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCloudQuestion} from '@fortawesome/pro-solid-svg-icons';

function NavigationView() {
    return (
        <nav className={styles.bar}>
            <p className={styles.brand}>
                <FontAwesomeIcon icon={faCloudQuestion} />
            </p>
        </nav>
    );
}

export default NavigationView;