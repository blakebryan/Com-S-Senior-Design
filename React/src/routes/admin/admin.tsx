import { toBeEnabled } from '@testing-library/jest-dom/matchers';
import { isDisabled } from '@testing-library/user-event/dist/utils';
import axios from 'axios';
import React, { useEffect, useReducer, useState } from 'react'
import { Button, Col, Container, Form, Row } from 'react-bootstrap'


/**
 * Interface representing the structure of the API data.
 */
interface APIData {
    /** Maximum wind speed allowed for the model. */
    maxWind: string;

    /** Maximum air density allowed for the model. */
    maxDensity: string;

    /** Maximum weight allowed for the model. */
    maxWeight: string;

    /** Status indicating whether the model's data has been updated. */
    updated: string;
}

/**
 * Reducer function to update the state of the model data.
 * @param state - Current state, represented as a `Map` of model names to their respective data.
 * @param action - An object describing the update to be performed, including the model name, attribute, and value.
 * @returns A new `Map` with the updated state.
 */
function updateData(state: Map<string, APIData>, action: { model: string, attribute: string, value: string }): Map<string, APIData> {
    if(action.attribute === "reset") return new Map<string, APIData>();
    
    let tmp = state.get(action.model);
    if(tmp === undefined) tmp = {maxWind:"0", maxDensity:"0", maxWeight:"0", updated: ""};
    tmp["updated"] = "true";
    tmp[action.attribute as keyof APIData] = action.value; 
    let ret = new Map(state);
    ret = ret.set(action.model, tmp);
    return ret;
}

/**
 * React component representing the Admin page for managing drone models.
 * Allows the user to add, update, delete, and reset model data.
 * @returns A rendered `Container` component with forms and controls for managing data.
 */
export default function AdminPage(){

    const [data, setData] = useReducer(updateData, new Map<string, APIData>());
    const [newName, setNewName]:[string, Function] = useState<string>("");

    /**
     * Function to update the `data` state with new data from the server.
     * @param data - Array of objects representing the new data for each model.
     */
    const updateDataFromBody = (data:{model: string, maxWind: string, maxDensity: string, maxWeight: string}[])=>{
        console.log(data);
        data.forEach((element:{model:string,maxWind:string,maxDensity:string,maxWeight:string})=>{
            setData({model:element.model, attribute:"maxWind", value:element.maxWind});
            setData({model:element.model, attribute:"maxDensity", value:element.maxDensity});
            setData({model:element.model, attribute:"maxWeight", value:element.maxWeight});
            setData({model:element.model, attribute:"updated", value:"false"});
        });
    }

    useEffect(()=>{
        axios.get('http://localhost:8080/admin/limits').then((res)=>{
            updateDataFromBody(res.data);
        });
    },[]);


    let items: React.JSX.Element[] = []

    let updateNeeded = false;
    data.forEach((data:APIData, make)=>{
        updateNeeded = updateNeeded || data.updated === "true";
    });

    data.forEach((data:APIData, make) => {
        items.push(<Row>
                <Col xs={1}>
                    <Button className='bg-danger' onClick={()=>{
                        axios.post(`http://localhost:8080/admin/delete`, {make}).then((res)=>{
                            setData({model:"", attribute:"reset", value:""});
                            updateDataFromBody(res.data);
                        })
                    }}>Delete</Button>
                </Col>
                <Col>
                    <Form.Text>{make}</Form.Text>
                </Col>
                <Col>
                    <Form.Control
                        name={data.maxWind}
                        value={data.maxWind}
                        onChange={(e)=>{
                            setData({model:make, attribute:"maxWind", value:e.target.value});
                        }}
                    />
                </Col>
                <Col>
                    <Form.Control
                        name={data.maxDensity}
                        value={data.maxDensity}
                        onChange={(e)=>{
                            setData({model:make, attribute:"maxDensity", value:e.target.value});
                        }}
                    />
                </Col>
                <Col>
                    <Form.Control
                        name={data.maxWeight}
                        value={data.maxWeight}
                        onChange={(e)=>{
                            setData({model:make, attribute:"maxWeight", value:e.target.value});
                        }}
                    />
                </Col>
            </Row>);
    });
    return <Container>
        {/* <Row className='bg-danger '>Remember to save any changes made!</Row> */}
        <Row>
            <Col xs={1}></Col>
            <Col>Make</Col>
            <Col>Max Wind Speed</Col>
            <Col>Max Density</Col>
            <Col>Max Weight</Col>
        </Row>
        {items}
        <Row>
            <Col xs={3}>
                <Form.Control name={"createMake"} value={newName} onChange={(e)=>{setNewName(e.target.value)}}/>
            </Col>
            <Col xs={2}>
                <Button onClick={()=>{
                    // no duplicates or empty
                    if(newName === "" || data.get(newName) !== undefined) return;
                    axios.post('http://localhost:8080/admin/add', {model:newName}).then((res)=>{
                        updateDataFromBody(res.data);
                        setNewName(""); 
                    })
                }}>Add New</Button>
            </Col>
            <Col xs={2}>
                <Button disabled={!updateNeeded} onClick={()=>{
                    data.forEach((data:APIData, make)=>{
                        axios.post(`http://localhost:8080/admin/update`, 
                            {
                                make:make, 
                                maxWind:data.maxWind, 
                                maxDensity:data.maxDensity,
                                maxWeight:data.maxWeight
                            }).then((res)=>{
                                updateDataFromBody(res.data);
                        })
                    });
                }}>Update All</Button>
            </Col>
            <Col xs={2}>
                <Button disabled={!updateNeeded} onClick={()=>{
                     data.forEach((data:APIData, make)=>{
                        axios.get(`http://localhost:8080/admin/limits`).then((res)=>{
                               updateDataFromBody(res.data);
                        })
                    });
                }}>Clear Unsaved Changes</Button>
            </Col>
        </Row>
    </Container>
}