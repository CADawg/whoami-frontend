import React from 'react';
import './Styles/App.scss';
import {BrowserRouter} from "react-router-dom";
import NavigationView from "./Views/NavigationView";
import LoginViewController from "./ViewController/LoginViewController";

function Router() {
  return (
    <BrowserRouter>
        <NavigationView />
        <LoginViewController />
    </BrowserRouter>
  );
}

export default Router;
