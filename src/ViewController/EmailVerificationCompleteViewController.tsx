import EmailVerificationView from "../Views/EmailVerificationView";
import urls from "../Global/Urls";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {useEffect, useState} from "react";

export default function EmailVerificationCompleteViewController() {
    const [success, setSuccess] = useState(false);
    const [afterUrl, setAfterUrl] = useState(urls.afterRegisterComplete);
    const navigate = useNavigate();
    const {code, email} = useParams();
    let timeout:NodeJS.Timeout|null = null;

    function checkEmailVerificationStatus(): void {
        axios.post(process.env.REACT_APP_API_URL + "auth/verify_email_code_status", {code, email}).then(response => {
            // Check success
            if (response.data.success) {
                if (response.data.data.verified) {
                    if (response.data.data.isThisUser){
                        setAfterUrl(urls.afterRegisterComplete);
                        timeout = setTimeout(() => navigate(urls.afterRegisterComplete), 5000);
                        return setSuccess(true);
                    } else {
                        // If not the current user, send them back to the login page
                        setAfterUrl(urls.login);
                        timeout = setTimeout(() => navigate(urls.login), 5000);
                        return setSuccess(true); // This is however, still a successful verification
                    }
                }
            }

            // If not success, we need to tell them and take them back to verify
            setAfterUrl(urls.emailVerify);
            timeout = setTimeout(() => navigate(urls.emailVerify), 5000);
        }).catch(() => {});
    }

    // Check verification status on load
    useEffect(checkEmailVerificationStatus);

    return (
      <EmailVerificationView hideInstructions>
        <h1>Email Verification {success? "Complete" : "Failed"}</h1>
          {success ?
              <p>Your email address has been verified. You will automatically be taken to WhoAmI in 5 seconds.</p> :
              <p>Sorry, we couldn't verify your email. You will be taken back to the verification page in 5 seconds.</p>
          }
        <button onClick={() => {if (timeout) clearTimeout(timeout); navigate(afterUrl)}}>Continue now</button>
      </EmailVerificationView>
    );
}