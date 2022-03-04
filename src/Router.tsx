import React from 'react';
import './Styles/App.scss';
import {BrowserRouter, Routes, Route, } from "react-router-dom";
import NavigationView from "./Views/NavigationView";
import SignUpViewController from "./ViewController/SignupViewController";
import { Buffer } from 'buffer';
import LoginViewController from "./ViewController/LoginViewController";
global.Buffer = Buffer; // Fix for browser not having Buffer

function Router() {
  return (
    <BrowserRouter>
        <NavigationView />
        <Routes>
            <Route path="/sign_up" element={<SignUpViewController />} />
            <Route path="/log_in" element={<LoginViewController />} />
        </Routes>
    </BrowserRouter>
  );
}

export default Router;
