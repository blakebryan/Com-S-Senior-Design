import React from "react";
import "./header.css";

/**
 * Header component for displaying the application's title.
 *
 * @returns {JSX.Element} A styled header element containing the title "Flight Risk Evaluation".
 */
export default function Header(): JSX.Element {
    return (
        <div className="header">
            <h1>Flight Risk Evaluation</h1>
        </div>
    );
}
