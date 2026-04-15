import React from 'react';
import { Link } from 'react-router-dom';
import { FaMosque, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-islamic-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <FaMosque className="text-8xl text-islamic-green mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-islamic-green-dark mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist. 
          Perhaps you mistyped the URL or the page has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 btn-primary"
        >
          <FaHome />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
