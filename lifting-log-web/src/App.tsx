import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Navbar from "./Navbar";
import Home from "./Routes/Home";
import WorkoutPage from './Routes/WorkoutPage';
import LoginPage from './Routes/LoginPage';
import Settings from "./Routes/Settings";
import NotFound from './Routes/NotFound';

function App() {
  const serverUrl = "http://localhost:8000";

  return (
    <>
        <BrowserRouter>
          <div className="routes-container">
            <Routes>
              <Route path="/" element={<Home url={serverUrl}/>}/>
              <Route path="/home" element={<Home url={serverUrl}/>}/>
              <Route path="/workout" element={<WorkoutPage url={serverUrl}/>}/>
              <Route path="/settings" element={<Settings url={serverUrl}/>} />

              <Route path="/login" element={<LoginPage url={serverUrl}/>} />
              <Route path="*" element={<NotFound />}/>
            </Routes>
          </div>
            <Navbar />
        </BrowserRouter>
    </>
  );
}

export default App;
