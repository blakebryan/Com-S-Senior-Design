import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "./category.css";
import Question from "./surveyQuestion/Question";
import { QuestionType, CategoryType } from "../../routes/survey/Survey";

/**
 * Props for the `Category` component.
 */
type CategoryProps = {
    /**
     * The title or header text for the category.
     */
    header: string;

    /**
     * The current form data as an array of key-value pairs.
     */
    formData: Array<string[]>;

    /**
     * The function to handle form data changes.
     */
    changeHandler: Function;

    /**
     * The list of questions within the category.
     */
    questionData: QuestionType[];

    /**
     * Subcategories nested within the current category.
     */
    subCategories: CategoryType[];

    /**
     * The depth level of the category in the hierarchy (used for styling).
     */
    depth: number;
};

/**
 * The `Category` component renders a category containing questions and subcategories.
 *
 * - Displays a header with a dynamic background color based on the category's depth.
 * - Groups questions into rows for display.
 * - Renders nested subcategories recursively.
 *
 * @param {CategoryProps} props - The properties for the `Category` component.
 * @returns {JSX.Element} The rendered category element.
 */
export default function Category(props: CategoryProps): JSX.Element {
    // Define colors for header background dynamically
    const colors = ["darkblue", "blue", "dodgerblue"];

    // Use `colors` array to assign background color dynamically based on depth
    const headerBackgroundColor = colors[props.depth % colors.length] || "white";

    // Creating the header element with dynamic background color
    const headerElement = (
        <Row>
            <Col className="bg-primary text-white">
                <div style={{ backgroundColor: headerBackgroundColor }}>
                    {props.header}
                </div>
            </Col>
        </Row>
    );

    // Create nested category elements for each sub-category
    const categoryElements = props.subCategories.map((category) => (
        <Col className="category" key={category.name}>
            <Category
                header={category.name}
                formData={props.formData}
                changeHandler={props.changeHandler}
                questionData={category.questionSet}
                subCategories={category.subCategories}
                depth={props.depth + 1}
            />
        </Col>
    ));

    // Create all questions stored in props
    const questionElements = props.questionData.map((question) => (
        <Col className="questionText question" key={question.name}>
            <Question
                questionName={question.name}
                changeHandler={props.changeHandler}
                header={question.name}
                formData={props.formData}
                type={question.type}
                questionText={question.text}
                answers={question.answers}
                subQuestions={question.subQuestions}
                mandatory={question.mandatory}
            />
        </Col>
    ));

    // Group questions into rows
    const sets = 3;
    const rows: React.JSX.Element[][] = [];
    for (let i = 0; i < questionElements.length; i++) {
        if (i % sets === 0) {
            rows.push([]);
        }
        rows[Math.floor(i / sets)].push(questionElements[i]);
    }

    // Map grouped rows into row elements
    const rowElements = rows.map((item, index) => (
        <Row key={`row${index}`}>
            {item}
        </Row>
    ));

    return (
        <React.Fragment>
            {headerElement}
            {categoryElements}
            {rowElements}
        </React.Fragment>
    );
}
