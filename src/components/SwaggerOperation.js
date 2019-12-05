import React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Box, Grid, Tabs, Tab, Button } from '@material-ui/core';
import { ResolveCurlRequest, MakeRequest } from './SwaggerApiRequest';
import { SwaggerModelExample, SwaggerModelFieldInput } from './SwaggerModel';


function SwaggerApiOperationParameter(parameter, swaggerSpec, operationId, controlState, setControlState) {
    return (
        <Grid container spacing={0} key={operationId + "-" + parameter.name + "-grid"}>
            <Grid item xs={12} lg={8}>
                <Grid container spacing={3} style={{width: "100%"}}>
                    <Grid item xs={12} lg={6}>
                        <Box fontWeight="fontWeightBold">
                            {parameter.name} {parameter.required ? '*' : ''}
                        </Box>
                        <Box fontStyle="italic">
                            {parameter.required ? 'Required' : 'Optional'} {parameter.in.charAt(0).toUpperCase() + parameter.in.slice(1)} Parameter (style: {parameter.style})
                        </Box>
                        <Box>
                            {parameter.description}
                        </Box>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <SwaggerModelExample key={operationId + "-" + parameter.name + "-example"} schema={parameter.schema} swaggerSpec={swaggerSpec} />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} lg={4}>
                <SwaggerModelFieldInput
                    key={operationId + "-" + parameter.name}
                    swaggerSpec={swaggerSpec}
                    operationId={operationId}
                    parameter={parameter}
                    controlState={controlState[parameter.in] ? controlState[parameter.in][parameter.name] : ""}
                    setControlState={(value) => {
                        const newObj = Object.assign({}, controlState);
                        if (!newObj[parameter.in]) {
                            newObj[parameter.in] = {};
                        }
                        newObj[parameter.in][parameter.name] = value;
                        setControlState(newObj);
                    }} />
            </Grid>
        </Grid>
    );
}

function SwaggerApiOperationParameters(parameters, swaggerSpec, operationId, controlState, setControlState) {
    return (
        <div>
            <Box fontSize="h6.fontSize">
                Parameters
            </Box>
            {parameters.flatMap(parameter => SwaggerApiOperationParameter(parameter, swaggerSpec, operationId, controlState, setControlState))}
        </div>
    );
}

function SwaggerApiOperationBody(requestBody, swaggerSpec, operationId, requestType, setRequestType, controlState, setControlState) {
    return (
        <Grid container spacing={3} style={{ width: "100%" }}>
            <Grid item xs={12} lg={12}>
                <Box fontSize="h6.fontSize">
                    Body
                </Box>
            </Grid>
            <Grid item xs={12} lg={4}>
                <Box fontWeight="fontWeightBold">
                    Request Body
                </Box>
                <Box fontStyle="italic">
                    {requestBody.required ? 'Required' : 'Optional'}
                </Box>
                <Box>
                    {requestBody.description}
                </Box>
            </Grid>
            <Grid item xs={12} lg={4}>
                {!requestBody.content ? <Box fontStyle="italic">No Request Body</Box> :
                    <Tabs value={requestType} onChange={(event, newValue) => { setRequestType(newValue); }}>
                        {Object.entries(requestBody.content).map(entry => <Tab label={entry[0]} />)}
                    </Tabs>
                }
                {!requestBody.content ? '' :
                    Object.entries(requestBody.content)
                        .map(entry => <SwaggerModelExample role="tabpanel" schema={entry[1].schema} swaggerSpec={swaggerSpec} />)
                }
            </Grid>
            <Grid item xs={12} lg={4}>
                {!requestBody.content ? <Box fontStyle="italic">No Request Body</Box> :
                    <Tabs value={requestType} onChange={(event, newValue) => { setRequestType(newValue); }}>
                        {Object.entries(requestBody.content).map(entry => <Tab label={entry[0]} />)}
                    </Tabs>
                }
                {!requestBody.content ? '' :
                    Object.entries(requestBody.content)
                        .map(entry =>
                            <SwaggerModelFieldInput
                                role="tabpanel"
                                swaggerSpec={swaggerSpec}
                                operationId={operationId}
                                parameter={entry[1]}
                                controlState={controlState["body"] ? controlState["body"] : ""}
                                setControlState={(value) => {
                                    const newObj = Object.assign({}, controlState);
                                    newObj["body"] = value;
                                    setControlState(newObj);
                                }} />
                        )
                }
            </Grid>
        </Grid>
    );
}

function SwaggerApiOperationResponse(responseCode, response, swaggerSpec, responseType, setResponseType) {
    return (
        <Grid container spacing={3} style={{width: "100%"}}>
            <Grid item xs={12} lg={6}>
                <Box fontFamily="Monospace" fontWeight="fontWeightBold">
                    {responseCode}
                </Box>
                <Box>
                    {response.description}
                </Box>
            </Grid>
            <Grid item xs={12} lg={6}>
                {!response.content ? <Box fontStyle="italic">No Response Body</Box> :
                    <Tabs value={responseType} onChange={(event, newValue) => { setResponseType(newValue); }}>
                        {Object.entries(response.content).map(entry => <Tab label={entry[0]} />)}
                    </Tabs>
                }
                {!response.content ? '' :
                    Object.entries(response.content)
                        .map(entry => <SwaggerModelExample role="tabpanel" schema={entry[1].schema} swaggerSpec={swaggerSpec} />)
                }
            </Grid>
        </Grid>
    );
}

function SwaggerApiOperationResponses(responses, swaggerSpec, responseType) {
    return (
        <div>
            <Box fontSize="h6.fontSize">
                Responses
            </Box>
            {Object.entries(responses || {}).flatMap(entry => SwaggerApiOperationResponse(entry[0], entry[1], swaggerSpec, responseType))}
        </div>
    );
}

/**
 * Renders the results form of a "try-it-out" style interface for a single swagger operation.
 * 
 * @param {*} props React component properties.
 * @param {string} prop.path Path of group.
 * @param {string} prop.host Host to send API requests to.
 * @param {string} prop.method HTTP Method of API operation.
 * @param {object} props.operation Swagger schema describing an operation.
 * @param {object} props.controlState Object representing current state of the "try-it-out" inputs.
 * @param {object} props.responseActual Object representing the actual response from an API operation.
 * @param {object} props.swaggerSpec Root Swagger specification document.
 */
export function SwaggerApiOperationForm(props) {
    return (
        <div>
            <div>
                <Button
                    variant="contained"
                    onClick={async () => {
                        // Convert props.controlState into its parsed form ready for form submission.
                        Object.entries(props.controlState)

                        try {
                            const response = await MakeRequest(props.method, props.host, props.path, props.operation, props.controlState);
                            if (response.ok && response.status / 100 === 2) {
                                props.setResponseActual(response.json());
                            } else {
                                props.setResponseActual(`${response.status} ${response.statusText}:\n\n${response.text()}`);
                            }
                        } catch (err) {
                            props.setResponseActual(`ERROR Making Request: ${JSON.stringify(err, null, 4)}`);
                        }
                    }}
                    style={{ width: "100%" }}>Execute Request</Button>
            </div>

            <Box>Actual Request:</Box>
            <SyntaxHighlighter language="json" style={docco}>
                {ResolveCurlRequest(props.method, props.host, props.path, props.operation, props.controlState)}
            </SyntaxHighlighter>

            <Box>Actual Response:</Box>
            <SyntaxHighlighter language="json" style={docco}>
                {JSON.stringify(props.responseActual, null, 2)}
            </SyntaxHighlighter>
        </div>
    );
}

/**
 * Renders documentation and a "try-it-out" style interface for a single swagger operation.
 * 
 * @param {*} props React component properties.
 * @param {string} prop.path Path of group.
 * @param {string} prop.host Host to send API requests to.
 * @param {string} prop.method HTTP Method of API operation.
 * @param {object} props.operation Swagger schema describing an operation.
 * @param {object} props.swaggerSpec Root Swagger specification document.
 */
export function SwaggerApiOperation(props) {
    const [requestType, setRequestType] = React.useState(0);
    const [responseType, setResponseType] = React.useState(0);
    const [responseActual, setResponseActual] = React.useState({});
    const [controlState, setControlState] = React.useState("");

    return (
        <form style={{width: "100%"}}>
            <Box fontSize="h5.fontSize" fontFamily="Monospace">{props.method.toUpperCase()} - {props.operation.operationId}</Box>
            <Box>{props.operation.summary}</Box>
            <Box>{props.operation.description}</Box>

            {(props.operation.parameters ? SwaggerApiOperationParameters(props.operation.parameters || [], props.swaggerSpec, props.operation.operationId, controlState, setControlState) : "")}
            {(props.operation.requestBody ? SwaggerApiOperationBody(props.operation.requestBody, props.swaggerSpec, props.operation.operationId, requestType, setRequestType, controlState, setControlState) : "")}

            <Grid container spacing={0}>
                <Grid item xs={12} lg={8}>
                    {(props.operation.responses ? SwaggerApiOperationResponses(props.operation.responses, props.swaggerSpec, responseType, setResponseType) : [])}
                </Grid>
                <Grid item xs={12} lg={4}>
                    <SwaggerApiOperationForm
                        method={props.method}
                        path={props.path}
                        host={props.host}
                        operation={props.operation}
                        controlState={controlState}
                        responseActual={responseActual}
                        setResponseActual={setResponseActual} />
                </Grid>
            </Grid>
        </form>
    );
}
