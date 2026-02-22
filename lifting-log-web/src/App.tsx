import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Navbar from "./Navbar";
import Home from "./Routes/Home";
import WorkoutPage from './Routes/WorkoutPage';
import LoginPage from './Routes/LoginPage';
import Settings from "./Routes/Settings";
import NotFound from './Routes/NotFound';
import EditTemplatePage from './Routes/EditTemplatePage';
import { AuthProvider, ProtectedRoute } from './AuthProvider';

function App() {
  return (
    <>
        <BrowserRouter>
          <AuthProvider>
            <div className="routes-container">
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }/>

                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }/>

                <Route path="/workout">
                  <Route index element={
                    <ProtectedRoute>
                      <WorkoutPage />
                    </ProtectedRoute>
                  }/>
                  <Route path="edit-template" element={
                    <ProtectedRoute>
                      <EditTemplatePage />
                    </ProtectedRoute>
                  }/>
                  {/* 
                  * this route below will prob not be here, 
                  * just in case I want workouting-out to be on seperate page.
                  * Will most likely have a conditional on workout page so those 2 pages are more connected (resume option, switch between the 2 easily, etc.)
                  */}
                  <Route path="working-out" element={
                    <ProtectedRoute>
                      <WorkoutPage /> 
                    </ProtectedRoute>
                  }/>
                </Route>

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                <Route path="/login" element={<LoginPage />} />

                <Route path="*" element={<NotFound />}/>
              </Routes>
            </div>
            <Navbar />
          </AuthProvider>
        </BrowserRouter>
    </>
  );
}

export default App;
