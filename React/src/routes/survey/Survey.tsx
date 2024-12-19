import React, {useEffect, useReducer, useState} from "react";
import "./survey.css";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Category from "../../components/surveyCategory/Category";
import Form from "react-bootstrap/Form";
import axios from 'axios';
import Cookies from "js-cookie";
import CookieConsent from "react-cookie-consent";
import {useNavigate} from "react-router-dom";
import {isValid} from "../../components/surveyCategory/surveyQuestion/Question";

// this is the form of the nodes coming from backend
export interface APIData {
    identifier: string;
    type: string;
    questionType: null | string;
    depth: number;
    children: APIData[];
    mandatory: string;
}

// this is all that can be extracted from backend info
// the rest is determined later
export interface QuestionType {
    name: string;
    text: string;
    type: string;
    answers?: string[];
    subQuestions?: QuestionType[];
    mandatory: string;
}

// categories can have subcategories and/or questions
export interface CategoryType {
    name: string;
    subCategories: CategoryType[];
    questionSet: QuestionType[];
}

// used for accessing question info in formData
export enum formDataValues {
    name = 0,
    answer = 1,
    type = 2,
    disabled = 3,
    mandatory = 4
}

/**
 * Finds a specific question in the form data.
 * @param formData - The array of form data, where each entry is an array of strings.
 * @param questionName - The name of the question to find.
 * @returns The question data as an array of strings or an empty array if not found.
 */
function findQuestion(formData: string[][], questionName: string): string[] {
    for (let i = 0; i < formData.length; i++) {
        const question = formData[i];
        if (question[formDataValues.name] === questionName) {
            return question;
        }
    }
    return [];
}

/**
 * Updates the form data for a specific question.
 * @param state - The current form data state as an array of string arrays.
 * @param action - An object containing the question name, answer, type, disabled, and mandatory values.
 * @returns A new form data state with the updated question data.
 */
function updateForm(state: string[][], action: { name: string, answer: string, type: string, disabled: string, mandatory: string }) {
    // when the 'reset form' button is hit
    if (action.name === "update" && action.answer === "clear") {
        return [];
    }
    const oldQuestion: string[] = findQuestion(state, action.name);
    // if the question doesn't have an entry in formData yet
    if (oldQuestion.length === 0) {
        return state.concat([[action.name, action.answer, action.type, action.disabled, action.mandatory]]);
    } else {
        // leaves all other questions unaffected, but updates values for affected one
        return state.map((question) => {
            if (question[formDataValues.name] === action.name) {
                question[formDataValues.answer] = action.answer;
                question[formDataValues.type] = action.type;
                question[formDataValues.disabled] = action.disabled;
                question[formDataValues.mandatory] = action.mandatory;
            }
            return question;
        });
    }
}

/**
 * Converts API data nodes into a `QuestionType` object, handling nested subquestions and answers.
 * @param node - The APIData node to convert.
 * @returns A `QuestionType` object representing the question and its children.
 */
function createQuestion(node: APIData): QuestionType {
    let subQuestions: QuestionType[] = [];
    let answers: string[] = [];
    if (node.children.length > 0) {
        node.children.forEach((child) => {
            if (child.type === "question") {
                subQuestions.push(createQuestion(child));
            } else if (child.type === "answer") {
                answers.push(child.identifier);
            }
        })
    }
    return {
        name: node.identifier,
        text: node.identifier,
        type: node.questionType || '',
        answers: answers,
        subQuestions: subQuestions,
        mandatory: node.mandatory
    };
}

/**
 * Recursively categorizes API data nodes into a hierarchical structure of categories and questions.
 * @param data - The root APIData node to categorize.
 * @param setFormData - A function to update the form data state.
 * @returns A `CategoryType` object representing the categorized data.
 */
function categorizeNodes(data: APIData, setFormData:Function): CategoryType {
    let header: CategoryType = {
        name: data.identifier,
        subCategories: [],
        questionSet: []
    }

    data.children.forEach(child => {
        if (child.type === "question") {
            // boolean questions always default to these values
            if (child.questionType === "boolean") {
                setFormData({ name:child.identifier, answer:"false", type:"boolean", disabled:"false", mandatory:"true" });
            }
            // some questions have their own subquestions
            let subQuestions: QuestionType[] = [];
            let answers: string[] = [];
            if (child.children.length > 0) {
                child.children.forEach((grandchild) => {
                    if (grandchild.type === "question") {
                        subQuestions.push(createQuestion(grandchild));
                    } else if (grandchild.type === "answer") {
                        answers.push(grandchild.identifier);
                    }
                })
            }
            // adds current question to current category
            header.questionSet.push({
                name: child.identifier,
                text: child.identifier,
                type: child.questionType || '',
                answers: answers,
                subQuestions: subQuestions,
                mandatory: child.mandatory
            });
        }
        if (child.type === "category") {
            header.subCategories.push(categorizeNodes(child, setFormData));
        }
    })
    return header;
}

/**
 * The main Survey component for rendering a survey form with categories and questions.
 * Handles fetching the survey data, managing form state, and submitting responses.
 * @returns A JSX element containing the survey form.
 */
export default function Survey() {
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [formData, setFormData] = useReducer(updateForm, []);
    const navigate = useNavigate();

    // set formData to contain all cookies
    useEffect(() => {
        const cookiesData = Cookies.get();
        Object.entries(cookiesData).forEach(([key, value]) => {
            if (findQuestion(formData, key).length === 0) {
                setFormData({ name: key, answer: value, type: "", disabled: "", mandatory: "" });
            }
        })
    }, []);

    // tells the backend to generate a tree of nodes from the feature model
    useEffect(() => {
        console.log('Fetching questions...');
        axios.get('http://localhost:8080/model')
            .then((response: { data: APIData }) => {
                // categorize returned nodes and store the top level categories for future reference
                let categorySet: CategoryType[] = [];
                response.data.children.forEach((child) => {
                    categorySet.push(categorizeNodes(child, setFormData));
                })
                setCategories(categorySet);
            })
            .catch(error => {
                console.error("There was an error fetching the model!", error);
            });
    }, []);

    /**
     * Determines whether a question should be submitted based on its validity and conditions.
     * @param question - The question data as an array of strings from the formData.
     * @returns `true` if the question should be submitted, `false` otherwise.
     */
    const shouldBeSubmitted = (question: string[]): boolean => {
        if (isValid(question[formDataValues.answer], question[formDataValues.type])) {
            if (!(findQuestion(formData, "Ground Obstacles In OR")[formDataValues.answer] === "0" &&
                question[formDataValues.name].includes("Obstacle") && question[formDataValues.type] !== "boolean")) {
                if (!(findQuestion(formData, "Polygon List Of Points")[formDataValues.answer] === "0" &&
                    question[formDataValues.name].includes("Point"))) {
                        return true;
                }
            }
        }
        return false;
    }

    /**
     * Handles the form submission event by packaging the form data and sending it to the server.
     * @param e - The form submission event.
     */
    const handleSubmit = (e: {preventDefault: Function}) => {
        e.preventDefault();
        const timestamp = String(Date.now()); // used to identify submissions
        const formDataObject: Record<string, string> = {};

        formData.forEach((question) => {
            if (shouldBeSubmitted(question)) {
                formDataObject[question[formDataValues.name]] = question[formDataValues.answer] || "";
            }
        });
        formDataObject['timestamp'] = timestamp;
        console.log(formDataObject);

        axios.post('http://localhost:8080/submit', formDataObject)
            .then(response => {
                console.log('Form submitted successfully:', response.data);
                // Force navigation to /survey-results no matter what:
                window.location.href = '/survey-results';
            })
            .catch(error => {
                console.error("There was an error submitting the form!", error);
                // Even if there's an error, still navigate to survey-results:
                window.location.href = '/survey-results';
            });
    };

    /**
     * Handles changes to individual questions in the form, updating formData and setting cookies.
     * @param question - The question data as an array of strings to be updated.
     */
    const handleChange = (question: string[]) => {
        setFormData({
            name: question[formDataValues.name],
            answer: question[formDataValues.answer],
            type: question[formDataValues.type],
            disabled: question[formDataValues.disabled],
            mandatory: question[formDataValues.mandatory]
        });
        Cookies.set(question[formDataValues.name], question[formDataValues.answer]);
    };

    // create React components for the top level categories
    const groups = categories.map((group, index) => {
        return <Category
            key={index}
            header={group.name}
            formData={formData}
            changeHandler={handleChange}
            subCategories={group.subCategories}
            questionData={group.questionSet}
            depth={0}
        />
    });

    // checking whether the form should be able to be submitted or not
    let disable = false;
    formData.forEach((question) => {
        const answer = question[formDataValues.answer];
        const type = question[formDataValues.type];
        const mandatory = question[formDataValues.mandatory];
        const disabled = question[formDataValues.disabled];
        // ignore optional questions and alternative questions that are disabled
        if (question[formDataValues.name] !== "Longitude Latitude" &&
            ((mandatory === "alternative" && disabled === "false") || (mandatory === "true" && type !== undefined))) {
            disable = disable || !isValid(answer, type);
        }
        console.log(question[formDataValues.name] + ": " + disable);
    });

    return (
        <Form onSubmit={handleSubmit}>
            <Container>
                <Row>
                    <Col className="subheader">
                        <Button
                            onClick={() => {
                                setFormData({ name:"update", answer:"clear", type:"", disabled:"", mandatory:"" })
                                // always default boolean questions to false
                                categories.forEach((cat)=>{
                                    cat.questionSet.forEach((q)=>{
                                        if(q.type === "boolean"){
                                            setFormData({name:`${q.name}`, answer:"false", type:"boolean", disabled:"false", mandatory:"true"});
                                        }
                                    })
                                });
                            }}
                        >
                            Reset Form
                        </Button>
                    </Col>
                    <Col className="subheader">
                        <Button onClick={() => { navigate("/survey-results") }}>
                            View Previous Answers
                        </Button>
                    </Col>
                    <Col className="subheader">
                        <Button onClick={() => { navigate("/notams") }}>
                            View Notams
                        </Button>
                    </Col>
                </Row>

                {groups}

                <Row>
                    <Col className="submitRow">
                        <Button type="submit" disabled={disable}>
                            Submit
                        </Button>
                    </Col>
                </Row>

                <CookieConsent location="bottom" buttonText="Ok">
                    We use cookies to enhance user experience.
                </CookieConsent>
            </Container>
        </Form>
    );
}