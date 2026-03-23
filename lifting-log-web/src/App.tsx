import React, { JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Routes/Home/Home";
import WorkoutPage from './Routes/WorkoutPage/WorkoutPage';
import WorkingOutPage from './Routes/WorkingOutPage/WorkingOutPage';
import LoginPage from './Routes/LoginPage/LoginPage';
import Settings from "./Routes/Settings/Settings";
import NotFound from './Routes/NotFound/NotFound';
import EditTemplatePage from './Routes/EditTemplatePage/EditTemplatePage';
import ViewWorkout from './Routes/ViewWorkout/ViewWorkout';
import { AuthProvider, ProtectedRoute } from './AuthProvider';

function App(): JSX.Element {
  return (
    <>
        <BrowserRouter>
          <AuthProvider>
              <Routes>
                <Route path="/" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                <Route path="/home" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />


                <Route path="/workout">
                  <Route index element={
                      <ProtectedRoute>
                        <WorkoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="edit-template" element={
                      <ProtectedRoute>
                        <EditTemplatePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="working-out" element={
                      <ProtectedRoute>
                        <WorkingOutPage /> 
                      </ProtectedRoute>
                    }
                  />
                  <Route path="view-workout" element={
                    <ProtectedRoute>
                      <ViewWorkout />
                    </ProtectedRoute>
                  }
                  />
                </Route>

                <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route path="/login" element={<LoginPage />} />

                <Route path="*" element={<NotFound />}/>
              </Routes>
            <Navbar />
          </AuthProvider>
        </BrowserRouter>
    </>
  );
}

export default App;
