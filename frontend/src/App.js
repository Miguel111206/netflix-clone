import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyList from './pages/MyList';
import SubscriptionPlans from './pages/SubscriptionPlans';
import ProfileSelection from './pages/ProfileSelection';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subscription" element={<SubscriptionPlans />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-list"
            element={
              <ProtectedRoute>
                <MyList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ProfileSelection />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;