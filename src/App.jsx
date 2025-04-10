import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import UserContentPage from './pages/UserContentPage';
import ArticleView from './pages/ArticleView';
import EditArticle from './pages/EditArticle';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login initialMode="signup" />} />
          <Route path="/articles/:slug" element={<ArticleView />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/your-content" element={<UserContentPage />} />
            <Route path="/edit-article/:id" element={<EditArticle />} />
            {/* Add other protected routes here */}
          </Route>
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 