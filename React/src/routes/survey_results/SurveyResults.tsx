/**
 * Component to display survey results and generated safety cases.
 * Fetches responses, safety case data, and pruned safety case data from the backend
 * and renders them alongside survey answers.
 */

import React, { useEffect, useState } from "react";
import "./SurveyResults.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import axios from "axios";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DownloadButton from "../../components/downloadButton/DownloadButton";
import SafetyCaseTree from "../../components/D3/SafetyCaseTree";

/**
 * Interface representing the structure of individual survey responses.
 */
interface Responses {
    _v: number;               // Version of the response
    _id: string;              // Unique identifier of the response
    questions: ResponseData[]; // Array of question responses
    timestamp: string;        // Timestamp of the response
}

/**
 * Interface for individual question data in survey responses.
 */
interface ResponseData {
    _id: string;             // Unique identifier of the question response
    questionName: string;    // The name of the question
    questionText: string;    // The text of the question
    answer: string;          // The answer provided for the question
    __v: number;             // Version of the question response
}

/**
 * Interface representing SVG paths for safety case diagrams.
 */
interface SvgPaths {
    suas: string;             // Path to the SUAS diagram
    safetyCase: string;       // Path to the full safety case diagram
    prunedSafetyCase: string; // Path to the pruned safety case diagram
}

/**
 * Functional component for displaying survey results and generated safety cases.
 */
export default function SurveyResults() {
    const [responses, setResponses] = useState<Responses[]>([]);           // List of survey responses
    const [loading, setLoading] = useState<boolean>(true);                 // Loading state
    const [error, setError] = useState<string | null>(null);               // Error message
    const [svgPaths, setSvgPaths] = useState<SvgPaths | null>(null);       // Paths to SVG files for safety cases
    const [safetyCaseData, setSafetyCaseData] = useState<any>(null);       // Data for the full safety case tree
    const [prunedSafetyCaseData, setPrunedSafetyCaseData] = useState<any>(null); // Data for the pruned safety case tree
    const [page, setPage] = useState<number>(0);                           // Current page index for survey responses
    const navigate = useNavigate();

    /**
     * Fetches survey responses from the backend and sorts them by timestamp.
     */
    useEffect(() => {
        // Fetch responses from the backend
        fetch("http://localhost:8080/responses")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch data at http://localhost:8080/responses"
                    );
                }
                return response.json();
            })
            .then((data: Responses[]) => {
                // Sort to find the latest timestamp, then set the current data.
                const sortedResponses = data.sort(
                    (a, b) => Number(b.timestamp) - Number(a.timestamp)
                );
                setResponses(sortedResponses);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    /**
     * Fetches the full safety case tree data from the backend.
     */
    useEffect(() => {
        fetch("http://localhost:8080/safety-case-data")
            .then((response) => {
                console.log("[SurveyResults] /safety-case-data response status:", response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error("[SurveyResults] /safety-case-data response text:", text);
                        throw new Error(`Failed to fetch safety-case-data: ${text}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log("[SurveyResults] Safety case data fetched successfully:", data);
                setSafetyCaseData(data);
            })
            .catch((error) => {
                console.error("[SurveyResults] Error fetching safety case data:", error);
                setError(error.message);
            });
    }, []);

    /**
     * Fetches the pruned safety case tree data from the backend.
     */
    useEffect(() => {
        // Fetch the safety case data
        fetch("http://localhost:8080/pruned-safety-case-data")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch data at http://localhost:8080/pruned-safety-case-data"
                    );
                }
                return response.json();
            })
            .then((data) => {
                console.log("Safety case data fetched successfully:", data);
                setPrunedSafetyCaseData(data);
            })
            .catch((error) => {
                console.error("Error fetching pruned safety case data:", error);
                setError(error.message);
            });
    }, []);

    /**
     * Fetches and generates safety cases (YAML and SVG) based on the current response page.
     */
    useEffect(() => {
        if (responses.length > 0 && responses[page]) {
            // Call the API to generate the YAML and SVG safety cases
            axios
                .post("http://localhost:8080/generate-safety-case", {
                    timestamp: responses[page].timestamp,
                })
                .then((response) => {
                    console.log("Safety cases generated successfully:", response.data);
                    // Store the SVG paths in the state to display the images
                    setSvgPaths(response.data.svgPaths);
                })
                .catch((error) => {
                    console.error("Error generating safety cases:", error);
                });
        }
    }, [responses, page]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (responses.length === 0 || !responses[page]) {
        return <div>No responses available.</div>;
    }

    //console.log(svgPaths);

    return (
        <Container className="survey-results">
            {/* Back button and header */}
            <Row>
                <Col className="prevCol">
                    <Button
                        className="prevButton"
                        onClick={() => {
                            navigate("/");
                        }}
                    >
                        Back
                    </Button>
                </Col>
                <Col className="subheader" xs={9}>
                    <h2>Generated Safety Case:</h2>
                </Col>
            </Row>

            {/* Conditional rendering for additional diagrams */}
            {svgPaths && (
                <>
                    <Row className="safety-case-section">
                        {/* Previous Button */}
                        <Col className="prevCol" xs={1}>
                            <Button
                                className="prevButton"
                                onClick={() => {
                                    setPage((prevPage) => Math.max(0, prevPage - 1));
                                }}
                            >
                                Prev
                            </Button>
                        </Col>
                        {/* Current Page Indicator */}
                        <Col className="prevCol" xs={1}>
                            <div className="p-2 bg-primary text-white prevButton">
                                {"Page: " + (page + 1)}
                            </div>
                        </Col>
                        {/* Safety Case Pass/Fail Tree */}
                        <Col className="subheader" xs={8}>
                            <h2>Safety Case Pass/Fail Tree:</h2>
                        </Col>
                        <Col className="prevCol">
                            <DownloadButton
                                path="http://localhost:8080/download-safety-case-data"
                                as="safetyCaseData.json"
                            />
                        </Col>
                        {/* Next Button */}
                        <Col className="nextCol">
                            <Button
                                className="nextButton"
                                onClick={() => {
                                    setPage((prevPage) =>
                                        Math.min(responses.length - 1, prevPage + 1)
                                    );
                                }}
                            >
                                Next
                            </Button>
                        </Col>
                    </Row>
                    {/* Render the Safety Case Tree */}
                    <Row className="safety-case-section">
                        <Col xs={12} className="white-bg">
                            {safetyCaseData ? (
                                <SafetyCaseTree data={safetyCaseData} treeType="full_tree" />
                            ) : (
                                <div>Loading Safety Case...</div>
                            )}
                        </Col>
                    </Row>
                    {/* Pruned Safety Case Section */}
                    <Row className="safety-case-section">
                        <Col className="subheader" xs={8}>
                            <h2>Pruned Safety Case:</h2>
                        </Col>
                        <Col className="prevCol">
                            <DownloadButton
                                path="http://localhost:8080/download-pruned-case-data"
                                as="prunedCaseData.json"
                            />
                        </Col>
                    </Row>
                    <Row className="safety-case-section">
                        <Col xs={12} className="white-bg">
                            {safetyCaseData && prunedSafetyCaseData ? (
                                <SafetyCaseTree data={prunedSafetyCaseData} treeType="pruned_tree" />
                            ) : (
                                <div>Loading Pruned Safety Case...</div>
                            )}
                        </Col>
                    </Row>
                    {/* Safety Case Diagram */}
                    <Row className="safety-case-section">
                        <Col className="subheader" xs={10}>
                            <h2>Safety Case Diagram:</h2>
                        </Col>
                        <Col className="prevCol">
                            <DownloadButton
                                path={`http://localhost:8080${svgPaths.safetyCase}`}
                                as={"SafetyCase.svg"}
                            />
                        </Col>
                        <Col xs={12} className="white-bg">
                            <img
                                className="safety-case-img"
                                src={`http://localhost:8080${svgPaths.safetyCase}`}
                                alt="Safety Case Diagram"
                            />
                        </Col>
                    </Row>
                    {/* Pruned Safety Case Diagram */}
                    <Row className="safety-case-section">
                        <Col className="subheader" xs={10}>
                            <h2>Pruned Safety Case Diagram:</h2>
                        </Col>
                        <Col className="prevCol">
                            <DownloadButton
                                path={`http://localhost:8080${svgPaths.prunedSafetyCase}`}
                                as={"PrunedSafetyCase.svg"}
                            />
                        </Col>
                        <Col xs={12} className="white-bg">
                            <img
                                className="safety-case-img"
                                src={`http://localhost:8080${svgPaths.prunedSafetyCase}`}
                                alt="Pruned Safety Case Diagram"
                            />
                        </Col>
                    </Row>
                    {/* Argument File Section */}
                    <Row className="safety-case-section">
                        <Col className="subheader" xs={10}>
                            <h2>Argument File:</h2>
                        </Col>
                        <Col className="prevCol">
                            {responses[page] && (
                                <DownloadButton
                                    path={`http://localhost:8080/download-argument/${responses[page].timestamp}`}
                                    as={`SafetyCase_${responses[page].timestamp}.argument`}
                                />
                            )}
                        </Col>
                    </Row>
                </>
            )}

            {/* Survey results */}
            <Row>
                <Col className="subheader">
                    <h2>Survey Results</h2>
                </Col>
            </Row>
            {responses[page].questions.map((response) => (
                <Row key={response._id} className="survey-response">
                    <Col xs={12} md={8}>
                        <h5>{response.questionText}</h5>
                        <p>
                            <strong>Answer:</strong> {response.answer}
                        </p>
                    </Col>
                </Row>
            ))}
        </Container>
    );
}
