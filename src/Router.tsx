import React from 'react';
import './Styles/App.scss';
import {BrowserRouter, Routes, Route, } from "react-router-dom";
import NavigationView from "./Views/NavigationView";
import SignUpViewController from "./ViewController/SignupViewController";
import { Buffer } from 'buffer';
import LoginViewController from "./ViewController/LoginViewController";
import EmailVerificationViewController from "./ViewController/EmailVerificationViewController";
import urls from "./Global/Urls";
global.Buffer = Buffer; // Fix for browser not having Buffer to decode and encode hex,b64,b64url .etc.

function Router() {
  return (
    <BrowserRouter>
        <NavigationView />
        <Routes>
            <Route path={urls.register} element={<SignUpViewController />} />
            <Route path={urls.login} element={<LoginViewController />} />
            <Route path={urls.emailVerify} element={<EmailVerificationViewController />} />
        </Routes>
    </BrowserRouter>
  );
}

export default Router;
