import React, { useCallback, useEffect, useState } from "react";
import "./question.css";
import Form from "react-bootstrap/Form";
import { Button, Row } from "react-bootstrap";
import { QuestionType, formDataValues } from "../../../routes/survey/Survey";
import axios from "axios";

/**
 * Props for the `Question` component.
 */
type QuestionProps = {
    /** The header text displayed for the question. */
    header: string;

    /** The unique name/identifier for the question. */
    questionName: string;

    /** The text/question content displayed to the user. */
    questionText: string;

    /** The type of the question (e.g., "integer", "float", "text", etc.). */
    type: string;

    /** An optional list of answers for multiple-choice questions. */
    answers?: string[];

    /** The current state of the form's data. */
    formData: Array<string[]>;

    /** Callback function for handling form data changes. */
    changeHandler: Function;

    /** Optional subquestions associated with this question. */
    subQuestions?: QuestionType[];

    /** Indicates if the question is mandatory. */
    mandatory: string;
};
/**
 * Checks whether a value is valid for a specific question type.
 * @param value - The input value to validate.
 * @param questionType - The type of the question (e.g., "integer", "float").
 * @returns `true` if the value is valid, otherwise `false`.
 */
export function isValid(value: string, questionType: any): boolean {
    if (value === undefined || value.length === 0) {
        return false;
    }
    const number = Number(value);
    switch (questionType) {
        case "integer":
            return (!isNaN(number)) && (number === Math.round(number));
        case "float":
            return !isNaN(number);
        case "zip":
            return /[0-9]{5}$/.test(value) && value.length === 5;
        case "text":
            return !(/[^A-z]$/.test(value));
        case "list":
            return number > 0;
        case "multiple choice":
            return value !== "0";
        default: // handles things like calc and cookie consent
            return true;
    }
}

/**
 * Represents a drone object retrieved from the backend.
 */
interface Drone {
    model: string,
    maxWind: string,
    maxDensity: string,
    maxWeight: string
}

/**
 * Component for rendering a question in the survey.
 * Handles different types of questions, including text input, multiple choice, and calculated fields.
 * @param props - The properties for the `Question` component.
 * @returns The rendered question element.
 */
function Question(props: QuestionProps) {
    const [valid, setValid] = useState(true);
    const [counter, setCounter] = useState(0);
    const [drones, setDrones] = useState(Array<Drone>);

    useEffect(() => {
        // creates array of all drone makes/models stored in the db that the admin has access to
        if (props.questionName === "Make and Model") {
            axios.get('http://localhost:8080/admin/limits').then((res) => {
                const drones: Array<Drone> = [];
                res.data.forEach((drone: {model: string, maxWind: string, maxDensity: string, maxWeight: string}) => {
                    if (drone.maxDensity !== "0") { // ignores duplicates that have all 0s for values
                        drones.push(drone);
                    }
                })
                setDrones(drones);
            });
        }

        // set an initial entry in the formData for each question using cookies
        // or default values when there is no cookie
        let initFormData: string[] = [];
        initFormData[formDataValues.name] = props.questionName;
        if ((props.type === "list" || props.type === "multiple choice")) {
            initFormData[formDataValues.answer] = getAnswer(props.questionName) || "0";
            if (props.type === "list") {
                setCounter(Number(initFormData[formDataValues.answer]));
            }
        } else if (props.type !== "boolean") {
            initFormData[formDataValues.answer] = getAnswer(props.questionName) || "";
        } else {
            initFormData[formDataValues.answer] = getAnswer(props.questionName) || "false";
        }
        initFormData[formDataValues.type] = props.type;
        initFormData[formDataValues.disabled] = `${determineIfDisabled(props.questionName)}`;
        initFormData[formDataValues.mandatory] = props.mandatory;
        props.changeHandler(initFormData);
    }, []);

    /**
     * Retrieves the answer value for a specific question from the form data.
     * @param questionName - The name of the question to retrieve.
     * @returns The answer value as a string or an empty string if not found.
     */
    function getAnswer(questionName: string): string {
        for (let i = 0; i < props.formData.length; i++) {
            const question = props.formData[i];
            if (question[formDataValues.name] === questionName) {
                return question[formDataValues.answer];
            }
        }
        return "";
    }
 
    // Search formData for a specific question's disabled status
    function getDisabled(questionName: string): string {
        for (let i = 0; i < props.formData.length; i++) {
            const question = props.formData[i];
            if (question[formDataValues.name] === questionName) {
                return question[formDataValues.disabled];
            }
        }
        return "";
    }

    /**
     * Adds an entry to a list question, updating the form data and UI.
     */
    const addToList = () => {
        let amountToAdd = 1;
        // at least three points needed to make a polygon
        if (props.questionName === "Polygon List Of Points" && counter === 0) {
            amountToAdd += 2;
        }
        // update formData to have the new value for counter (render new inputs)
        props.changeHandler([
            props.questionName, 
            `${counter + amountToAdd}`, 
            props.type, 
            `${determineIfDisabled(props.questionName)}`, 
            props.mandatory
        ]);
        setCounter(counter + amountToAdd);
    }

    /**
     * Removes an entry from a list question, updating the form data and UI.
     */
    const removeFromList = () => {
        let amountToRemove = 1;
        // ensure there can never be 1 or 2 inputs
        if (props.questionName === "Polygon List Of Points" && counter === 3) {
            amountToRemove += 2;
        }
        // update formData with new value for counter
        props.changeHandler([
            props.questionName, 
            `${counter - amountToRemove}`, 
            props.type, 
            `${determineIfDisabled(props.questionName)}`, 
            props.mandatory
        ]);
        setCounter(counter - amountToRemove);
    }

    /**
     * Handles input changes for a question and updates the form data.
     * Validates the input value based on the question type.
     * @param e - The event triggered by an input change.
     * @param question - The corresponding form data entry for the question.
     */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, question: string[]) => {
        const { value } = e.target; // get input value
        question[formDataValues.answer] = value; // create updated formData entry
        props.changeHandler(question); // update formData
        setValid(isValid(value, question[formDataValues.type])); // check if answer is valid
    }, [props]);


    /**
     * Calculates the density altitude at takeoff using the provided altitude, pressure altitude, and air temperature.
     * @param {any} altitude - Altitude above sea level (in feet or meters).
     * @param {any} pressure_alt - Pressure altitude at takeoff (in feet).
     * @param {any} air_temp - Air temperature at takeoff (in degrees Celsius).
     * @returns {string} The density altitude as a string or "N/A" if inputs are invalid.
     */
    function calculateDensityAltitude(altitude: any, pressure_alt: any, air_temp: any): string {
        let newCalc = ["Density Alt at Takeoff", getAnswer("Density Alt at Takeoff"), "calc", "true", "true"];

        // Convert inputs to numbers
        const altitude_ft = Number(altitude); // Altitude in feet
        let pressure_altitude = Number(pressure_alt); // Pressure altitude in feet
        const actual_air_temp = Number(air_temp); // Air temperature in Celsius

        // Validate inputs
        if (isNaN(altitude_ft) || isNaN(pressure_altitude) || isNaN(actual_air_temp)) {
            console.error("Invalid input values:", { altitude, pressure_alt, air_temp });
            if (newCalc[formDataValues.answer] !== "N/A") {
                newCalc[formDataValues.answer] = "N/A";
                props.changeHandler(newCalc);
            }
            return "N/A";
        }

        // Ensure sea level conditions for zero values
        const altitude_m = altitude_ft * 0.3048; // Convert feet to meters
        const seaLevelPressurePa = 101325; // Standard pressure at sea level in Pascals
        const pressurePa = pressure_altitude > 0
            ? seaLevelPressurePa * Math.pow(1 - 2.25577e-5 * altitude_m, 5.25588)
            : seaLevelPressurePa;

        // Calculate pressure altitude from sea-level pressure
        pressure_altitude = (1 - Math.pow(pressurePa / seaLevelPressurePa, 1 / 5.25588)) / (2.25577e-5) / 0.3048;

        // Calculate standard temperature at the given altitude
        const standard_temp = 15 - (2 * altitude_ft / 1000); // ISA lapse rate: -2°C per 1000 ft

        // Calculate density altitude
        const temperature_deviation = actual_air_temp - standard_temp;
        const density_alt = pressure_altitude + 120 * temperature_deviation;

        // Log intermediate calculations for debugging
        console.log("Inputs:", { altitude_ft, pressure_altitude, actual_air_temp });
        console.log("Pressure (Pa):", pressurePa);
        console.log("Pressure Altitude (ft):", pressure_altitude);
        console.log("Standard Temp:", standard_temp);
        console.log("Temperature Deviation:", temperature_deviation);
        console.log("Density Altitude:", density_alt);

        if (isNaN(density_alt)) {
            if (newCalc[formDataValues.answer] !== "N/A") {
                newCalc[formDataValues.answer] = "N/A";
                props.changeHandler(newCalc);
            }
            return "N/A";
        } else {
            const roundedDensityAlt = Math.round(density_alt);
            if (newCalc[formDataValues.answer] !== `${roundedDensityAlt}`) {
                newCalc[formDataValues.answer] = `${roundedDensityAlt}`;
                props.changeHandler(newCalc);
            }
            return `${roundedDensityAlt}`;
        }
    }


    /**
     * Determines whether a specific question should be disabled based on its name and related form data.
     * @param questionName - The name of the question.
     * @returns `true` if the question should be disabled, otherwise `false`.
     */
    function determineIfDisabled(questionName: string): boolean {
        switch (questionName) {
            // these three only allow user input when 'other' is selected
            case "Max Wind Speed":
            case "Max Density Alt":
            case "Max Takeoff Weight":
                return !(getAnswer("Make and Model") === "Other");
            // this isn't actually a question, but just displays a value
            case "Density Alt At Takeoff":
                return true;
            // disables these 4 questions in an alternative category if the other alt category
            // has an answer inputted in any of its questions
            // ideally these 4 and the next 2 would not be hardcoded in the future and instead
            // made dynamic, so the feature model can be changed without everything breaking
            case "Location Longitude":
            case "Location Latitude":
            case "Zip Code":
            case "City Name":
                if ((getAnswer("Polygon List Of Points") !== "0" && getAnswer("Polygon List Of Points") !== ""
                && getAnswer("Polygon List Of Points") !== undefined)
                || (getAnswer("Cylinder Radius") !== "" && getAnswer("Cylinder Radius") !== undefined)) {
                    // update each question's disabled value in formData if it hasn't been already
                    if (getDisabled("Location Longitude") === "false") {
                        props.changeHandler(["Location Longitude", "", "float", "true", "alternative"]);
                    }
                    if (getDisabled("Location Latitude") === "false") {
                        props.changeHandler(["Location Latitude", "", "float", "true", "alternative"]);
                    }
                    if (getDisabled("Zip Code") === "false") {
                        props.changeHandler(["Zip Code", "", "zip", "true", "alternative"]);
                    }
                    if (getDisabled("City Name") === "false") {
                        props.changeHandler(["City Name", "", "text", "true", "alternative"]);
                    }
                    return true;
                }
                // update each question's disabled value in formData if it hasn't been already
                if (getDisabled("Location Longitude") === "true") {
                    props.changeHandler(["Location Longitude", "", "float", "false", "alternative"]);
                }
                if (getDisabled("Location Latitude") === "true") {
                    props.changeHandler(["Location Latitude", "", "float", "false", "alternative"]);
                }
                if (getDisabled("Zip Code") === "true") {
                    props.changeHandler(["Zip Code", "", "zip", "false", "alternative"]);
                }
                if (getDisabled("City Name") === "true") {
                    props.changeHandler(["City Name", "", "text", "false", "alternative"]);
                }
                return false;
            // disables these 2 questions in an alternative category if the other alt category
            // has an answer inputted in any of its questions
            case "Polygon List Of Points":
            case "Cylinder Radius":
                if ((getAnswer("Location Longitude") !== "" && getAnswer("Location Longitude") !== undefined)
                || (getAnswer("Location Latitude") !== "" && getAnswer("Location Latitude") !== undefined)
                || (getAnswer("Zip Code") !== "" && getAnswer("Zip Code") !== undefined)
                || (getAnswer("City Name") !== "" && getAnswer("City Name") !== undefined)) {
                    // update each question's disabled value in formData if it hasn't been already
                    if (getDisabled("Polygon List Of Points") === "false") {
                        props.changeHandler(["Polygon List Of Points", "0", "list", "true", "alternative"]);
                    }
                    if (getDisabled("Cylinder Radius") === "false") {
                        props.changeHandler(["Cylinder Radius", "", "integer", "true", "alternative"]);
                    }
                    return true;
                }
                // update each question's disabled value in formData if it hasn't been already
                if (getDisabled("Polygon List Of Points") === "true") {
                    props.changeHandler(["Polygon List Of Points", "0", "list", "false", "alternative"]);
                }
                if (getDisabled("Cylinder Radius") === "true") {
                    props.changeHandler(["Cylinder Radius", "", "integer", "false", "alternative"]);
                }
                return false;
            default: // all other questions are never disabled
                return false;
        }
    }

    // this is the main portion for rendering questions based on their type
    switch (props.type) {
        case "boolean": // True/False or Yes/No questions
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Check
                        onChange={() => props.changeHandler([props.questionName, "true", "boolean", "false", "true"])}
                        type={"radio"}
                        id={`${props.questionName}True`}
                        key={`${props.questionName}True`}
                        label={"Yes"}
                        inline
                        checked={getAnswer(props.questionName) === "true"}
                    />
                    <Form.Check
                        onChange={() => props.changeHandler([props.questionName, "false", "boolean", "false", "true"])}
                        type={"radio"}
                        id={`${props.questionName}False`}
                        key={`${props.questionName}False`}
                        label={"No"}
                        inline
                        checked={getAnswer(props.questionName) === "false"}
                    />
                </React.Fragment>
            );

        // these questions have subquestions and/or answers
        case "multiple choice":
            /* selection refers to the dropdown portion, which only
            * exists when there are answers to the question
            */
            let selection: React.JSX.Element = <React.Fragment></React.Fragment>;
            if (props.answers !== undefined) {
                if (props.answers.length > 0) {
                    // here the array of options gets set
                    let options: any[] = [];
                    if (props.questionName === "Make and Model") {
                        options = [
                            <option value={0} key="default">Select an option</option>,
                            ...(drones.map((drone) => (
                                <option value={drone.model} key={drone.model}>{drone.model}</option>
                            )) || []),
                            // option for allowing user input on subquestions
                            <option value="Other" key="Other">Other</option>
                        ];
                    } else {
                        options = [
                            <option value={0} key="default">Select an option</option>,
                            ...(props.answers?.map((answer) => (
                                <option value={answer} key={answer}>{answer}</option>
                            )) || [])
                        ];
                    }
                    // here the React component is actually created
                    selection = 
                    <Form.Select
                        key={props.questionName}
                        value={getAnswer(props.questionName) || ""}
                        onChange={(e) => {
                            // first update the formData for the make and model question
                            handleInputChange(e, [
                                props.questionName, 
                                "", 
                                props.type, 
                                `${determineIfDisabled(props.questionName)}`, 
                                props.mandatory
                            ]);
                            // then handle the values for the subquestions
                            if (props.questionName === "Make and Model") {
                                const { value } = e.target;
                                // reset the values for subquestions when no model is selected
                                if (value === "Other" || value === "0") {
                                    props.changeHandler(["Max Wind Speed", "", "integer", "true", "true"]);
                                    props.changeHandler(["Max Density Alt", "", "integer", "true", "true"]);
                                    props.changeHandler(["Max Takeoff Weight", "", "integer", "true", "true"]);
                                } else {
                                    // set values for subquestions based off specs for the selected model
                                    drones.forEach((drone) => {
                                        if (drone.model === value) {
                                            props.changeHandler(["Max Wind Speed", drone.maxWind, "integer", "true", "true"]);
                                            props.changeHandler(["Max Density Alt", drone.maxDensity, "integer", "true", "true"]);
                                            props.changeHandler(["Max Takeoff Weight", drone.maxWeight, "integer", "true", "true"]);
                                        }
                                    });
                                }
                            }
                        }}
                        disabled={determineIfDisabled(props.questionName)}
                    >
                        {options}
                    </Form.Select>
                }
            }
            /* subQuestions can exist on top of a selection,
            *  or as the only content of the question (see Longitude Latitude)
            */
            let subQuestions: React.JSX.Element[] = [];
            props.subQuestions?.forEach((item) => {
                let input = <Question
                    changeHandler={props.changeHandler}
                    formData={props.formData}
                    header={`${item.name}`}
                    questionName={`${item.name}`}
                    questionText={item.text}
                    subQuestions={item.subQuestions}
                    type={item.type}
                    answers={item.answers}
                    key={`${item.name}`}
                    mandatory={item.mandatory}
                />
                subQuestions.push(input);
            });

            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    {selection}
                    <Row></Row>
                    {subQuestions}
                </React.Fragment>
            );

        case "integer": // integer questions
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Control
                        className="form-control"
                        name={props.questionName}
                        key={props.questionName}
                        onChange={(e) => {
                            handleInputChange(e, [
                                props.questionName, 
                                "", 
                                props.type, 
                                `${determineIfDisabled(props.questionName)}`, 
                                props.mandatory
                            ]);
                            // when input is given to relevant questions, re-calculate densityAlt
                            if (props.questionName === "Pressure Alt At Takeoff (Feet)" 
                            || props.questionName === "Alt Above Sea Level At Takeoff (Feet)") {
                                calculateDensityAltitude(
                                    getAnswer("Pressure Alt At Takeoff (Feet)"),
                                    getAnswer("Alt Above Sea Level At Takeoff (Feet)"),
                                    getAnswer("Air Temp at Takeoff (Celsius)")
                                );
                            }
                        }}
                        value={getAnswer(props.questionName) || ""}
                        placeholder="Enter an Integer (e.g. 25)"
                        type="integer"
                        isInvalid={!valid}
                        disabled={determineIfDisabled(props.questionName)}
                    />
                    <Form.Control.Feedback type="invalid">
                        Please enter whole numbers only
                    </Form.Control.Feedback>
                </React.Fragment>
            );

        case "float": // float questions
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Control
                        className="form-control"
                        name={props.questionName}
                        key={props.questionName}
                        onChange={(e) => {
                            handleInputChange(e, [
                                props.questionName, 
                                "", 
                                props.type, 
                                `${determineIfDisabled(props.questionName)}`, 
                                props.mandatory
                            ]);
                            // when input is given to relevant questions, re-calculate densityAlt
                            if (props.questionName === "Air Temp at Takeoff (Celsius)") {
                                calculateDensityAltitude(
                                    getAnswer("Pressure Alt At Takeoff (Feet)"),
                                    getAnswer("Alt Above Sea Level At Takeoff (Feet)"),
                                    getAnswer("Air Temp at Takeoff (Celsius)")
                                );
                            }
                        }}
                        value={getAnswer(props.questionName) || ""}
                        placeholder="Enter Number (e.g. 125.6)"
                        type="float"
                        isInvalid={!valid}
                        disabled={determineIfDisabled(props.questionName)}
                    />
                    <Form.Control.Feedback type="invalid">
                        Please enter numbers only
                    </Form.Control.Feedback>
                </React.Fragment>
            );
        /* zip code question (currently looks for exactly 5 digits,
        * and has no check to see if it's a real zip code)
        */
        case "zip":
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Control
                        className="form-control"
                        name={props.questionName}
                        key={props.questionName}
                        onChange={(e) => {
                            handleInputChange(e, [
                                props.questionName, 
                                "", 
                                props.type, 
                                `${determineIfDisabled(props.questionName)}`, 
                                props.mandatory
                            ]);
                        }}
                        value={getAnswer(props.questionName) || ""}
                        placeholder="Enter Abbreviated ZIP Code (e.g. 50014)"
                        type="zip"
                        isInvalid={!valid}
                        disabled={determineIfDisabled(props.questionName)}
                    />
                    <Form.Control.Feedback type="invalid">
                        Please enter a 5 digit ZIP code
                    </Form.Control.Feedback>
                </React.Fragment>
            );

        /* Text input questions - only one currently is for city
        * again, no checks for if it's a real city
        */
        case "text":
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Control
                        className="form-control"
                        name={props.questionName}
                        key={props.questionName}
                        onChange={(e) => {
                            handleInputChange(e, [
                                props.questionName, 
                                "", 
                                props.type, 
                                `${determineIfDisabled(props.questionName)}`, 
                                props.mandatory
                            ]);
                        }}
                        value={getAnswer(props.questionName) || ""}
                        placeholder="Enter City of Operation"
                        type="text"
                        isInvalid={!valid}
                        disabled={determineIfDisabled(props.questionName)}
                    />
                    <Form.Control.Feedback type="invalid">
                        Please enter letters and spaces only
                    </Form.Control.Feedback>
                </React.Fragment>
            );

        case "list": // list type questions allow user to keep inputting more answers
            let subQuestionList: React.JSX.Element[] = [];
            // counter is the amount of times to generate each input
            for (let i = 0; i < counter; i++) {
                props.subQuestions?.forEach((item) => {
                    // handles indexing of sub-subquestions
                    // if more layers of questions added in the future,
                    // then it would be best to make an iterative helper function
                    let newSubquestions: QuestionType[] = [];
                    item.subQuestions?.forEach((question) => {
                        let newQuestion: QuestionType = {
                            answers: question.answers, 
                            name: `${question.name} ${i + 1}`, 
                            text: question.text, 
                            type: question.type, 
                            mandatory: question.mandatory, 
                            subQuestions: question.subQuestions
                        };
                        newSubquestions.push(newQuestion);
                    });
                    // create subquestion with possible sub-subquestions
                    let input = <Question
                        changeHandler={props.changeHandler}
                        formData={props.formData}
                        header={`${item.name} ${i + 1}`}
                        questionName={`${item.name}${i + 1}`}
                        questionText={item.text}
                        subQuestions={newSubquestions}
                        type={item.type}
                        answers={item.answers}
                        key={`${item.name}${i + 1}`}
                        mandatory={item.mandatory}
                    />
                    subQuestionList.push(input);
                });
                subQuestionList.push(<Row></Row>);
            }
            let removeButton;
            // only shows remove button if there are inputs to remove
            if (subQuestionList.length > 0) {
                removeButton = <Button onClick={removeFromList} disabled={determineIfDisabled(props.questionName)}>Remove</Button>;
            }
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Row></Row>
                    {subQuestionList}
                    <Button onClick={addToList} disabled={determineIfDisabled(props.questionName)}>Add More</Button>
                    {removeButton}
                </React.Fragment>
            );

        /* this question type is for fields that display a calculated value (not inputted)
        * only one currently is densityAlt
        */
        case "calc":
            return (
                <React.Fragment>
                    <span>{props.header}</span>
                    <Form.Control
                        className="form-control"
                        name={props.questionName}
                        key={props.questionName}
                        value={getAnswer(props.questionName) || "N/A"}
                        type="text"
                        disabled={determineIfDisabled(props.questionName)}
                        readOnly={true}
                    />
                </React.Fragment>
            );

        default:
            return <React.Fragment>ERROR: Unsupported Type: "{props.type}"</React.Fragment>; // Handle cases where the type is unknown
    }
}

export default Question;
// export default React.memo(Question, (prevProps, nextProps) => {
//     // Deeply compare the formData and other props if necessary
//     return (
//         prevProps.formData.get(prevProps.questionName) === nextProps.formData.get(nextProps.questionName) &&
//         prevProps.type === nextProps.type
//     );
// });
