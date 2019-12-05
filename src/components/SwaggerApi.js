import React from 'react';
import './SwaggerApi.css';

import AppBar from '@material-ui/core/AppBar';
import { Toolbar, Box, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Divider, Button, TextField } from '@material-ui/core';
import { SwaggerApiOperation } from './SwaggerOperation';

import * as yaml from 'js-yaml';


/**
 * React component representing a group of Swagger API operations (grouped by path).
 * 
 * @param {*} prop React component properties.
 * @param {string} prop.path Path of group.
 * @param {object} prop.pathData Swagger schema object of group.
 * @param {string} prop.host Host to send API requests to.
 * @param {object} prop.swaggerSpec Root Swagger schema document.
 */
export function SwaggerApiOperationGroup(prop) {
    return (
        <ExpansionPanel key={prop.path}>
            <ExpansionPanelSummary>
                <Box fontSize="h3.fontSize" fontFamily="Monospace">
                    {prop.path}
                </Box>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div style={{width: "100%", paddingLeft: "32px"}}>
                    {
                        Object.entries(prop.pathData)
                            .flatMap(entry => [
                                <Divider key={prop.path + "-" + entry[0] + "-divider"} orientation="horizontal" ></Divider>,
                                <SwaggerApiOperation
                                    key={prop.path + "-" + entry[0]}
                                    host={prop.host}
                                    path={prop.path}
                                    method={entry[0]}
                                    operation={entry[1]}
                                    swaggerSpec={prop.swaggerSpec}
                                    style={{width: '100%'}} />
                            ])
                    }
                </div>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
}

/**
 * Renders Swagger API servers.
 * 
 * @param {array<object>} servers Swagger schema describing supported API servers.
 * @param {Function} setApiHost Function used to update the apiHost value.
 */
function SwaggerApiServers(servers, setApiHost) {
    return (
        <div>
            <Box>
                API Servers:
            </Box>
            <ul>
                {servers.map(server => <li><Button onClick={() => {setApiHost(server.url);}}>{server.url} {server.description ? "(" + server.description + ")" : ""}</Button></li>)}
            </ul>
        </div>
    );
}

/**
 * Renders a Swagger API title.
 * 
 * @param {string} title Identifier for an API.
 */
function SwaggerApiTitle(title) {
    return (
        <Box fontSize="h1.fontSize">
            {title}
        </Box>
    );
}

/**
 * Renders a Swagger API description.
 * 
 * @param {string} description Description for an API.
 */
function SwaggerApiDesc(description) {
    return (
        <Box>
            {description}
        </Box>
    );
}

/**
 * Renders a Swagger API version.
 * 
 * @param {string} version Version for an API.
 */
function SwaggerApiVersion(version) {
    return (
        <Box>
            Version: {version}
        </Box>
    );
}

/**
 * Renders a Swagger API termsOfService.
 * 
 * @param {string} termsOfService TOS for an API.
 */
function SwaggerApiTos(termsOfService) {
    return (
        <Box>
            <a href={termsOfService}>Terms of service</a>
        </Box>
    );
}

/**
 * Renders Developer contact info.
 * 
 * @param {object} contact Swagger schema describing developer contact info.
 */
function SwaggerApiDevContact(contact) {
    return (
        <Box>
            Developer: {
                contact.url
                    ? (<a href={contact.url}>{contact.name}</a>)
                    : contact.name
            }
            {contact.email ? (<span>(<a href={"mailto:" + contact.email}>{contact.email}</a>)</span>) : ''}
        </Box>
    );
}

/**
 * Renders Swagger API license information.
 * 
 * @param {object} license Swagger schema describing the license of an API.
 */
function SwaggerApiLicense(license) {
    return (
        <Box>
            {license.url ? (<a href={license.url}>{license.name}</a>) : license.name}
        </Box>
    );
}

/**
 * Renders documentation as well as a "try-it-out" interface from a provided swagger
 * specification.
 * 
 * @param {*} props React component properties.
 * @param {string} props.swaggerUrl Address of a swagger specification.
 * @param {string} props.apiHost Address of a swagger API host.
 */
export default function SwaggerApi(props) {
    const [swaggerUrl, setSwaggerUrl] = React.useState(props.swaggerUrl);
    const [apiHost, setApiHost] = React.useState(props.apiHost);
    const [swaggerSpec, setSwaggerSpec] = React.useState({});

    return (
        <div>
            <AppBar position="static">
                <Toolbar style={{ display: "flex", flexFlow: "row nowrap", alignItems: "center", justifyContent: "stretch" }}>
                    <Box fontSize="h6">
                        Swagger-DocGen
                    </Box>
                    <span style={{ width: "24px" }}></span>
                    <TextField
                        style={{ flex: "1 2 auto" }}
                        value={swaggerUrl}
                        onChange={(event) => { setSwaggerUrl(event.target.value); }}
                        variant="outlined"
                        label="URL to OpenAPI 3.0 specification file (JSON or YAML)." />
                    <span style={{ width: "24px" }}></span>
                    <Button
                        onClick={async () => {
                            const response = await fetch(swaggerUrl);
                            const rawResponse = JSON.parse(JSON.stringify(yaml.safeLoad(await response.text())));
                            console.log(rawResponse);
                            setSwaggerSpec(rawResponse);
                        }}>
                        YAML
                    </Button>
                    <span style={{ width: "24px" }}></span>
                    <Button
                        onClick={async () => {
                            const response = await fetch(swaggerUrl);
                            setSwaggerSpec(await response.json());
                        }}>
                        JSON
                    </Button>
                    <span style={{ width: "24px" }}></span>
                    <TextField
                        style={{ flex: "1 1 auto" }}
                        value={apiHost}
                        onChange={(event) => { setApiHost(event.target.value); }}
                        variant="outlined"
                        label="Host to make queries against." />
                </Toolbar>
            </AppBar>


            <div style={{margin: "24px"}}>
                {!(swaggerSpec.info && swaggerSpec.info.title) ? '' : SwaggerApiTitle(swaggerSpec.info.title)}
                {!(swaggerSpec.info && swaggerSpec.info.description) ? '' : SwaggerApiDesc(swaggerSpec.info.description)}
                {!(swaggerSpec.info && swaggerSpec.info.version) ? '' : SwaggerApiVersion(swaggerSpec.info.version)}
                {!(swaggerSpec.info && swaggerSpec.info.termsOfService) ? '' : SwaggerApiTos(swaggerSpec.info.termsOfService)}
                {!(swaggerSpec.info && swaggerSpec.info.contact && swaggerSpec.info.contact.name) ? '' : SwaggerApiDevContact(swaggerSpec.info.contact)}
                {!(swaggerSpec.info && swaggerSpec.info.license && swaggerSpec.info.license.name) ? '' : SwaggerApiLicense(swaggerSpec.info.license)}
                {!(swaggerSpec.servers) ? '' : SwaggerApiServers(swaggerSpec.servers, setApiHost)}
            </div>
            <div style={{margin: "24px"}}>
                {!swaggerSpec.paths ? "" :
                    // Display Operations.
                    Object.entries(swaggerSpec.paths)
                        .map(entry => <SwaggerApiOperationGroup host={apiHost} path={entry[0]} pathData={entry[1]} swaggerSpec={swaggerSpec} />)
                }
            </div>
        </div>
    );
}
