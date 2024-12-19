import React from "react";
import NotamsContainer from "../../components/notams/notamsContainer";

/**
 * A React component representing the NOTAMs (Notice to Airmen) page.
 *
 * This component renders a `NotamsContainer` component, passing the `options` prop.
 *
 * @returns A React element containing the `NotamsContainer`.
 */
export default function Notams(){
    return (
        <NotamsContainer options={10000}/>
    );
}