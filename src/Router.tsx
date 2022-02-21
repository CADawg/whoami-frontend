import React from 'react';
import './Styles/App.scss';
import {BrowserRouter} from "react-router-dom";
import LoginView from "./Views/LoginView";
import NavigationView from "./Views/NavigationView";

function Router() {
  return (
    <BrowserRouter>
        <NavigationView />
        <LoginView buttonText={"Continue"} />
    </BrowserRouter>
  );
}

export default Router;
