require('dotenv').config()
const fs = require('fs');
const { mapResponseToGoal, adjustLeafNodeStatus } = require("../../utils/goalCheck")
const { ArgumentNode, ArgumentTree } = require('../../models/argumentTreeModel');





describe('Goal Check tests for safety case', () => {

    test('Should map form submission to safety case and mark tree appropriately', async () => {
        const answers = {
            "Max Altitude in flight": "900",
            "Current windspeed": "130",
            "Flight duration": "15",
            "Current battery charge": "50",
            "Current battery health": "Bad_Battery_Health",
            "Operating Temp": "100",
            "Obstancle avoidance system": "true",
            "Aircraft avoidance system": "false"
        };
        let path = "./Tests/test_data/test.argument";
        let tree = await mapResponseToGoal(answers, path);

        let jsonTree = tree.toJSON();

        expectedJSON = {
            "entity": {
              "id": "G1",
              "description": "\"Ensure flight safety requirements are met\"",
              "toBeDeveloped": false
            },
            "failed": true,
            "children": [
              {
                "entity": {
                  "id": "S1",
                  "description": "\"Evaluate all safety parameters\""
                },
                "failed": true,
                "children": [
                  {
                    "entity": {
                      "id": "G2",
                      "description": "\"Flight parameters are acceptable\"",
                      "toBeDeveloped": false
                    },
                    "failed": false,
                    "children": [
                      {
                        "entity": {
                          "id": "S2",
                          "description": "\"Check flight parameters\""
                        },
                        "failed": false,
                        "children": [
                          {
                            "entity": {
                              "id": "G5",
                              "description": "\"Altitude is within limits\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn1",
                                  "description": "\"[Max_Altitude_Feet] <= 900\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          },
                          {
                            "entity": {
                              "id": "G6",
                              "description": "\"Wind conditions are safe\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn2",
                                  "description": "\"[Wind_Speed_MPH] <= 130\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          },
                          {
                            "entity": {
                              "id": "G7",
                              "description": "\"Duration is acceptable\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn3",
                                  "description": "\"[Flight_Duration_Minutes] <= 15\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "entity": {
                      "id": "G3",
                      "description": "\"Battery conditions are acceptable\"",
                      "toBeDeveloped": false
                    },
                    "failed": true,
                    "children": [
                      {
                        "entity": {
                          "id": "S3",
                          "description": "\"Verify battery status\""
                        },
                        "failed": true,
                        "children": [
                          {
                            "entity": {
                              "id": "G8",
                              "description": "\"Battery charge is sufficient\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn4",
                                  "description": "\"[Current_Battery_Charge] >= 50\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          },
                          {
                            "entity": {
                              "id": "G9",
                              "description": "\"Battery health is good\"",
                              "toBeDeveloped": false
                            },
                            "failed": true,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn5",
                                  "description": "\"[Current_Battery_Health] == 'Good_Battery_Health'\""
                                },
                                "failed": true,
                                "children": []
                              }
                            ]
                          },
                          {
                            "entity": {
                              "id": "G10",
                              "description": "\"Temperature is within range\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn6",
                                  "description": "\"[Air_Temp_at_Takeoff] <= 100\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "entity": {
                      "id": "G4",
                      "description": "\"Safety systems are operational\"",
                      "toBeDeveloped": false
                    },
                    "failed": true,
                    "children": [
                      {
                        "entity": {
                          "id": "S4",
                          "description": "\"Confirm safety systems\""
                        },
                        "failed": true,
                        "children": [
                          {
                            "entity": {
                              "id": "G11",
                              "description": "\"Avoidance systems are functional\"",
                              "toBeDeveloped": false
                            },
                            "failed": false,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn7",
                                  "description": "\"[Obstacle_Avoidance_Sys] == true\""
                                },
                                "failed": false,
                                "children": []
                              }
                            ]
                          },
                          {
                            "entity": {
                              "id": "G12",
                              "description": "\"Aircraft detection is working\"",
                              "toBeDeveloped": false
                            },
                            "failed": true,
                            "children": [
                              {
                                "entity": {
                                  "id": "Sn8",
                                  "description": "\"[Aircraft_Avoidance_Sys] == false\""
                                },
                                "failed": true,
                                "children": []
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          
        }

        expect(expectedJSON).toEqual(jsonTree);
          
          

    });

});