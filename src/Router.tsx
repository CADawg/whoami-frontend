import React from 'react';
import './Styles/App.scss';
import {BrowserRouter, Routes, Route, } from "react-router-dom";
import NavigationView from "./Views/NavigationView";
import SignUpViewController from "./ViewController/SignupViewController";
import { Buffer } from 'buffer';
import LoginViewController from "./ViewController/LoginViewController";
import EmailVerificationViewController from "./ViewController/EmailVerificationViewController";
import urls from "./Global/Urls";
import EmailVerificationCompleteViewController from "./ViewController/EmailVerificationCompleteViewController";
import AuthenticationViewModel from "./ViewModels/AuthenticationViewModel";
import AuthenticatedGuard from './Global/AuthenticatedGuard';
import LogoutViewController from "./ViewController/LogoutViewController";
import HomeViewController from "./ViewController/HomeViewController";
import RecoveryViewController from "./ViewController/RecoveryViewController";
import AccountRecoveryViewController from "./ViewController/AccountRecoveryViewController";
global.Buffer = Buffer; // Fix for browser not having Buffer to decode and encode hex,b64,b64url .etc.
const authViewModel = new AuthenticationViewModel();

function Router() {
  return (
    <BrowserRouter>
        <NavigationView authViewModel={authViewModel} />

        {/*Routes that require authentication must be wrapped in an <AuthenticatedGuard />
        component. This component will check if the user is authenticated and redirect (also handles making sure emails are verified)
        */}
        <Routes>
            <Route path={urls.register} element={<SignUpViewController authViewModel={authViewModel} />} />
            <Route path={urls.login} element={<LoginViewController authViewModel={authViewModel} />} />
            <Route path={urls.logout} element={<LogoutViewController authViewModel={authViewModel} />} />
            <Route path={urls.emailVerifyCallback + "/:code/:email"} element={<EmailVerificationCompleteViewController />} />
            <Route path={urls.emailVerify} element={<EmailVerificationViewController />} />
            <Route path={urls.recovery} element={<AuthenticatedGuard authViewModel={authViewModel}><RecoveryViewController authViewModel={authViewModel} /></AuthenticatedGuard>} />
            <Route path={urls.activateRecovery} element={<AccountRecoveryViewController />} />
            <Route path={urls.home} element={<AuthenticatedGuard authViewModel={authViewModel}><HomeViewController authViewModel={authViewModel} /></AuthenticatedGuard>} />
        </Routes>
    </BrowserRouter>
  );
}

export default Router;
