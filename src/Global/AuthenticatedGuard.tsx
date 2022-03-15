import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {useNavigate} from "react-router-dom";
import urls from "./Urls";
import {useEffect, useState} from "react";

// All routes requiring authentication should be wrapped in this component
// It handles login state changes, and redirects to the login page if necessary or email verification if required
export default function AuthenticatedGuard(props: {authViewModel: AuthenticationViewModel, children: any}) {
    const [navigateTo, setNavigateTo] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (navigateTo !== "") {
            navigate(navigateTo);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigateTo]);

    // If the user's logged in status changes, we may need to block this route (requires logged-in status)
    function authStatusUpdate(loggedIn: boolean) {
        if (!loggedIn) {
            setNavigateTo(urls.login);
        }
    }

    useEffect(() => {
        props.authViewModel.authEvents.on("loginStatusUpdate", authStatusUpdate);
        return () => {
            props.authViewModel.authEvents.off("loginStatusUpdate", authStatusUpdate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (navigateTo === "") {
        if (props.authViewModel.isLoggedIn()) {
            if (props.authViewModel.isEmailVerified()) {
                return props.children;
            } else {
                setNavigateTo(urls.emailVerify);
                return null;
            }
        } else {
            // Redirect to login page
            setNavigateTo(urls.login);
            return null;
        }
    } else {
        return null;
    }
}