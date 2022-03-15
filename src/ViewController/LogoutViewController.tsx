import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import urls from "../Global/Urls";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";

export default function LogoutViewController(props: {authViewModel: AuthenticationViewModel}): null {
    const [logout, setLogout] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        props.authViewModel.logout();
        navigate(urls.login);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logout]);

    if (!logout) {
        setLogout(true);
    }

    return null;
}