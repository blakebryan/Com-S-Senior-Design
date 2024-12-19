/**
 * @file index.js
 * The main entry point for the React application. It sets up the root component, router, and global styles.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global CSS styles
import reportWebVitals from './reportWebVitals'; // Performance monitoring
import { createBrowserRouter, RouterProvider } from "react-router-dom"; // React Router for navigation
import PageContainer from './components/pageContainer/pageContainer.tsx'; // Wrapper component for pages
import Header from './components/header/Header.tsx'; // Header component
import Survey from "./routes/survey/Survey.tsx"; // Survey page route
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS framework
import 'react-bootstrap'; // React Bootstrap components
import SurveryResults from './routes/survey_results/SurveyResults.tsx'; // Survey Results page route
import AdminPage from './routes/admin/admin.tsx'; // Admin page route
import Notams from './routes/notams/notams.tsx'; // NOTAMs (Notices to Airmen) page route

/**
 * Define the application routes using React Router.
 * Each route maps a URL path to a specific component.
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <Survey/> // Main survey page
    },
    {
        path: "/survey-results",
        element: <SurveryResults/> // Survey results page
    },
    {
        path: "/admin",
        element: <AdminPage/> // Admin page
    },
    {
        path: "/notams",
        element: <Notams/> // NOTAMs page
    }
]);

// Get the root HTML element where the React application will be rendered
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the React application.
 * - Wraps the application in React.StrictMode for highlighting potential issues.
 * - Includes a PageContainer component to provide layout structure.
 * - Adds a Header for navigation.
 * - Uses the RouterProvider for managing routes.
 */
root.render(
    <React.StrictMode>
        <PageContainer>
            <Header />
            <RouterProvider router={router} />
        </PageContainer>
    </React.StrictMode>
);

// Measure and report performance metrics (optional)
reportWebVitals();
