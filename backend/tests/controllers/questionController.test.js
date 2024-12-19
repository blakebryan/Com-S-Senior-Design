require('dotenv').config()
const { parseQuestionTree, generateQuestions } = require("../../controllers/questionController")
const { QuestionNode, QuestionTree } = require('../../models/questionTreeModel');
const parseXMLToJS = require('../../utils/xmlParser');
const fs = require("fs")


describe('QuestionNode and QuestionTree Module', () => {
    test('Should create a QuestionNode with correct properties', () => {
        const node = new QuestionNode('test_id', 0, "true", "true");
        expect(node.identifier).toBe('test_id');
        expect(node.depth).toBe(0);
        expect(node.abstract).toBe("true");
        expect(node.mandatory).toBe("true");
        expect(node.children).toEqual([]);
    });

    test('Should add a child to a QuestionNode', () => {
        const parent = new QuestionNode('parent', 0);
        const child = new QuestionNode('child', 1);
        parent.addChild(child);

        expect(parent.children).toContain(child);
        expect(child.parent).toBe(parent);
    });

    test('Should categorize nodes correctly', () => {
        const root = new QuestionNode('ROOT', 0);
        const child1 = new QuestionNode('FLOAT_Child1', 1);
        const child2 = new QuestionNode('STRING_City', 1, "true");

        root.addChild(child1);
        root.addChild(child2);

        const tree = new QuestionTree(root);
        tree.categorizeTree();

        expect(root.type).toBe('root');
        expect(child1.type).toBe('question');
        expect(child2.type).toBe('category');
    });
});


describe('QuestionController Module', () => {

    beforeAll(() => {
        fs.writeFileSync('./tests/test_data/output.json', '');
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('Should create an \"alt node question tree from XML\"', async () => {
        const altTree = await generateQuestions("./tests/test_data/test_alt.xml")
        const outputData = {
            "ALT": altTree
        }
        fs.appendFileSync(
            './tests/test_data/output.json',
            JSON.stringify(outputData, null, 2) + '\n\n'
            
        );
        const expectedJSON = {
            "identifier": "Multiple_Choice_Test",
            "type": "root",
            "questionType": null,
            "depth": 0,
            "mandatory": "true",
            "children": [
              {
                "identifier": "TUPLE_Favorite_Color",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "Red",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Blue",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Green",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  }
                ]
              },
              {
                "identifier": "TUPLE_User_Role",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "Admin",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "User",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Guest",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  }
                ]
              }
            ]
          }


        expect(altTree.toJSON()).toStrictEqual(expectedJSON);


    });

    test('Should create an \"and node question tree from XML\"', async () => {
        const andTree = await generateQuestions("./tests/test_data/test_and.xml")
        const outputData = {
            "AND": andTree
        }
        fs.appendFileSync(
            './tests/test_data/output.json',
            JSON.stringify(outputData, null, 2) + '\n\n'
            
        );
        const expectedJSON = {
            "identifier": "Feature_Type_Test",
            "type": "root",
            "questionType": null,
            "depth": 0,
            "mandatory": "true",
            "children": [
              {
                "identifier": "Basic_Types",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "Age",
                    "type": "question",
                    "questionType": "integer",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Temperature",
                    "type": "question",
                    "questionType": "float",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Is Active",
                    "type": "question",
                    "questionType": "boolean",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "City Name",
                    "type": "question",
                    "questionType": "text",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Zip Code",
                    "type": "question",
                    "questionType": "zip",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  }
                ]
              },
              {
                "identifier": "Complex_Types",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "LIST_Favorite_Foods",
                    "type": "category",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": [
                      {
                        "identifier": "Food_Item",
                        "type": "answer",
                        "questionType": null,
                        "depth": 3,
                        "mandatory": "true",
                        "children": []
                      },
                      {
                        "identifier": "Rating",
                        "type": "answer",
                        "questionType": null,
                        "depth": 3,
                        "mandatory": "true",
                        "children": []
                      }
                    ]
                  },
                  {
                    "identifier": "TUPLE_Color_Choice",
                    "type": "category",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": [
                      {
                        "identifier": "Red",
                        "type": "answer",
                        "questionType": null,
                        "depth": 3,
                        "mandatory": "true",
                        "children": []
                      },
                      {
                        "identifier": "Blue",
                        "type": "answer",
                        "questionType": null,
                        "depth": 3,
                        "mandatory": "true",
                        "children": []
                      },
                      {
                        "identifier": "Green",
                        "type": "answer",
                        "questionType": null,
                        "depth": 3,
                        "mandatory": "true",
                        "children": []
                      }
                    ]
                  },
                  {
                    "identifier": "Total Score",
                    "type": "question",
                    "questionType": "calc",
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  }
                ]
              },
              {
                "identifier": "Default_Behaviors",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "No_Prefix_Multiple_Choice",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "No_Prefix_Text_Input",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Contains_Yes",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  },
                  {
                    "identifier": "Contains_No",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "true",
                    "children": []
                  }
                ]
              }
            ]
          }

        expect(andTree.toJSON()).toStrictEqual(expectedJSON);


    });

    test('Should create an \"or node question tree from XML\"', async () => {
        const orTree = await generateQuestions("./tests/test_data/test_or.xml")
        const outputData = {
            "OR": orTree
        }
        fs.appendFileSync(
            './tests/test_data/output.json',
            JSON.stringify(outputData, null, 2) + '\n\n'
            
        );
        

        const expectedJSON = {
            "identifier": "Multiple_Selection_Test",
            "type": "root",
            "questionType": null,
            "depth": 0,
            "mandatory": "true",
            "children": [
              {
                "identifier": "LIST_Favorite_Foods",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "Pizza",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  },
                  {
                    "identifier": "Burger",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  },
                  {
                    "identifier": "Sushi",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  }
                ]
              },
              {
                "identifier": "LIST_Programming_Languages",
                "type": "category",
                "questionType": null,
                "depth": 1,
                "mandatory": "true",
                "children": [
                  {
                    "identifier": "Python",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  },
                  {
                    "identifier": "Java",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  },
                  {
                    "identifier": "JavaScript",
                    "type": "answer",
                    "questionType": null,
                    "depth": 2,
                    "mandatory": "false",
                    "children": []
                  }
                ]
              }
            ]
          }

        expect(orTree.toJSON()).toStrictEqual(expectedJSON);

    });


    test('Should create an \"and or alt node question tree from XML\"', async () => {
        const andAltOrTree = await generateQuestions("./tests/test_data/test_and_or_alt_model.xml")
        const outputData = {
            "AND_OR_ALT": andAltOrTree
        }
        fs.appendFileSync(
            './tests/test_data/output.json',
            JSON.stringify(outputData, null, 2) + '\n\n'
            
        );
        const expectedJSON = {
          "identifier": "Flight_Safety_Check",
          "type": "root",
          "questionType": null,
          "depth": 0,
          "mandatory": "true",
          "children": [
            {
              "identifier": "Flight_Parameters",
              "type": "category",
              "questionType": null,
              "depth": 1,
              "mandatory": "true",
              "children": [
                {
                  "identifier": "Max Altitude Feet",
                  "type": "question",
                  "questionType": "integer",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Wind Speed MPH",
                  "type": "question",
                  "questionType": "float",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Flight Duration Minutes",
                  "type": "question",
                  "questionType": "integer",
                  "depth": 2,
                  "mandatory": "false",
                  "children": []
                }
              ]
            },
            {
              "identifier": "Battery",
              "type": "category",
              "questionType": null,
              "depth": 1,
              "mandatory": "true",
              "children": [
                {
                  "identifier": "Current Battery Health",
                  "type": "question",
                  "questionType": "multiple choice",
                  "depth": 2,
                  "mandatory": "true",
                  "children": [
                    {
                      "identifier": "Low_Battery_Health",
                      "type": "answer",
                      "questionType": null,
                      "depth": 3,
                      "mandatory": "true",
                      "children": []
                    },
                    {
                      "identifier": "Med_Battery_Health",
                      "type": "answer",
                      "questionType": null,
                      "depth": 3,
                      "mandatory": "true",
                      "children": []
                    },
                    {
                      "identifier": "Good_Battery_Health",
                      "type": "answer",
                      "questionType": null,
                      "depth": 3,
                      "mandatory": "true",
                      "children": []
                    }
                  ]
                },
                {
                  "identifier": "Max Hover Time",
                  "type": "question",
                  "questionType": "integer",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Current Battery Charge",
                  "type": "question",
                  "questionType": "float",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Min Operating Temp",
                  "type": "question",
                  "questionType": "integer",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Max Operating Temp",
                  "type": "question",
                  "questionType": "integer",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                }
              ]
            },
            {
              "identifier": "Sensors",
              "type": "category",
              "questionType": null,
              "depth": 1,
              "mandatory": "false",
              "children": [
                {
                  "identifier": "Obstacle Avoidance Sys",
                  "type": "question",
                  "questionType": "boolean",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                },
                {
                  "identifier": "Aircraft Avoidance Sys",
                  "type": "question",
                  "questionType": "boolean",
                  "depth": 2,
                  "mandatory": "true",
                  "children": []
                }
              ]
            }
          ]
        }



        expect(andAltOrTree.toJSON()).toStrictEqual(expectedJSON);


    });

    test('Parsed questions comparison', async () => {
        const andAltOrTree = await generateQuestions("./tests/test_data/test_and_or_alt_model.xml")

        const parsedQuestions = await parseQuestionTree(andAltOrTree.questionSet);

        let expectedParsedQuestions = [
          {
            "name": "Current Battery Health",
            "text": "Select the appropriate option for Current Battery Health",
            "type": "multiple-choice",
            "children": [
              {
                "identifier": "Low_Battery_Health"
              },
              {
                "identifier": "Med_Battery_Health"
              },
              {
                "identifier": "Good_Battery_Health"
              }
            ]
          },
          {
            "name": "Obstacle Avoidance Sys",
            "text": "Obstacle Avoidance Sys?",
            "type": "boolean"
          },
          {
            "name": "Aircraft Avoidance Sys",
            "text": "Aircraft Avoidance Sys?",
            "type": "boolean"
          }
        ]
        
        fs.writeFileSync(
          './tests/test_data/parsed.json',
          JSON.stringify(parsedQuestions, null, 2) + '\n\n'

      );

        expect(expectedParsedQuestions).toStrictEqual(parsedQuestions);


    });


});

