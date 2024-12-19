import React, { ReactNode } from "react";
import "./pageContainer.css";

/**
 * Props for the `PageContainer` component.
 */
interface PageContainerProps {
    /**
     * The child elements to be rendered inside the page container.
     */
    children: ReactNode;
}

/**
 * A container component for wrapping page content with consistent styling.
 *
 * This component provides a styled container to wrap the children elements.
 * It ensures a consistent layout for pages and applies CSS styles from the associated
 * `pageContainer.css` file.
 *
 * @param {PageContainerProps} props - The props for this component.
 * @param {ReactNode} props.children - The child elements to render inside the container.
 * @returns {JSX.Element} The rendered page container.
 */
export default function PageContainer({ children }: PageContainerProps): JSX.Element {
    return <div className="pageContainer">{children}</div>;
}
