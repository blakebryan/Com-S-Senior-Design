import axios from "axios";
import React, { useCallback, useState } from "react";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook

/**
 * Props interface for the `NotamsContainer` component.
 */
interface NotamsContainerProps {
    /**
     * The number of options for some internal logic (currently unused).
     */
    options: number;
}

/**
 * Component for searching and displaying NOTAMs (Notices to Airmen).
 *
 * This component provides a search interface where users can input a location code
 * and fetch corresponding NOTAM data from the backend API. The results are displayed
 * in a table with columns for start time, end time, and condition.
 *
 * @param {NotamsContainerProps} props - The props for this component.
 * @returns {JSX.Element} A container with a search input, button, and results table.
 */
export default function NotamsContainer(props: NotamsContainerProps): JSX.Element {
    const [responses, setResponses] = useState<JSX.Element[] | undefined>();
    const [searchValue, setSearchValue] = useState<string>("");
    const navigate = useNavigate(); // Initialize the navigate function

    /**
     * Updates the search value in the state when the input changes.
     *
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - The change event from the input field.
     */
    const updateSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { value } = e.target;
            setSearchValue(value.toUpperCase());
        },
        []
    );

    /**
     * Fetches NOTAMs from the backend API based on the search value and updates the responses state.
     */
    const searchNotams = () => {
        axios
            .get(`http://localhost:8080/notams?loc=${searchValue}`) // See apiRoutes on backend for more info
            .then((response) => {
                if (response.data !== undefined) {
                    setResponses(
                        response.data.items.map((item: any, index: number) => {
                            return (
                                <tr key={index}>
                                    <td>{item.properties.coreNOTAMData.notam.effectiveStart}</td>
                                    <td>{item.properties.coreNOTAMData.notam.effectiveEnd}</td>
                                    <td>{item.properties.coreNOTAMData.notam.text}</td>
                                </tr>
                            );
                        })
                    );
                }
            })
            .catch((error) => {
                console.error("Error fetching NOTAMs:", error);
            });
    };

    return (
        <Container>
            {/* Back button */}
            <Row>
                <Col xs={1}>
                    <Button
                        className="prevButton"
                        onClick={() => navigate("/")} // Navigate back to the home page
                    >
                        Back
                    </Button>
                </Col>
            </Row>

            {/* Search functionality */}
            <Row>
                <Col xs={1}>
                    <Form.Control
                        placeholder="Search"
                        onChange={updateSearch}
                        aria-label="Search input for NOTAMs"
                    />
                </Col>
                <Col xs={2}>
                    <Button onClick={searchNotams} aria-label="Search NOTAMs">
                        Search for NOTAMS
                    </Button>
                </Col>
            </Row>

            {/* Results Table */}
            <Table bordered>
                <thead>
                <tr>
                    <th>Effective Start</th>
                    <th>Effective End</th>
                    <th>Condition</th>
                </tr>
                </thead>
                <tbody>{responses}</tbody>
            </Table>
        </Container>
    );
}
