import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Navbar from "./Navbar";
import Home from "./Routes/Home";
import NotFound from './Routes/NotFound';

function App() {
  return (
    <>
        <BrowserRouter>
          <div className="routes-container">
            <Routes>
              <Route path="/" element={<Home/>}/>

              <Route path="*" element={<NotFound />}/>
            </Routes>
          </div>
            <Navbar />
        </BrowserRouter>
    </>
  );
}

export default App;
