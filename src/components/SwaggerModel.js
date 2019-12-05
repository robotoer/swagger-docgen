import React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Box, TextField, FormControlLabel, Checkbox } from '@material-ui/core';

import _ from 'lodash';


const debounceInput = (callback) => (event) => {
    event.persist();
    return _.debounce(callback, 200)(event);
};


function AddNumericConstraints(schema) {
    const constraints = [];
    if (schema.minimum && schema.maximum) {
        constraints.push(`between ${schema.minimum} (${schema.exclusiveMinimum ? 'exclusive' : 'inclusive'}) and ${schema.maximum} (${schema.exclusiveMaximum ? 'exclusive' : 'inclusive'})`)
    } else if (schema.minimum) {
        constraints.push(`greater than ${schema.minimum} (${schema.exclusiveMinimum ? 'exclusive' : 'inclusive'})`)
    } else if (schema.maximum) {
        constraints.push(`less than ${schema.maximum} (${schema.exclusiveMaximum ? 'exclusive' : 'inclusive'})`)
    }
    if (schema.multipleOf) {
        constraints.push(`multiple of ${schema.multipleOf}`)
    }

    if (constraints.length > 0) {
        return ': ' + constraints.join(', ')
    }

    return '';
}

function AddStringConstraints(schema) {
    const constraints = [];
    if (schema.pattern) {
        constraints.push(`matching ${schema.pattern}`)
    }

    if (constraints.length > 0) {
        return ': ' + constraints.join(', ')
    }

    return '';
}

function AddArrayConstraints(schema) {
    const constraints = [];
    if (schema.minItems && schema.maxItems) {
        constraints.push(`between ${schema.minItems} and ${schema.maxItems} items`)
    } else if (schema.minItems) {
        constraints.push(`greater than ${schema.minItems} items`)
    } else if (schema.maxItems) {
        constraints.push(`less than ${schema.maxItems} items`)
    }
    if (schema.uniqueItems) {
        constraints.push("containing unique items")
    }

    if (constraints.length > 0) {
        return ': ' + constraints.join(', ')
    }

    return '';
}

function ResolveModelRefs(schema, rootSchema) {
    let currentSchema = schema;
    while (currentSchema["$ref"]) {
        currentSchema = currentSchema["$ref"].slice(2).split('/').reduce((current, segment) => current[segment], rootSchema);
    }

    return currentSchema;
}

function ResolveModelExample(schema, rootSchema) {
    if (!schema) {
        return schema;
    } else if (schema["$ref"]) {
        return ResolveModelExample(ResolveModelRefs(schema, rootSchema), rootSchema);
    } else if (schema.oneOf) {
        return "One of the following:\n" + schema.oneOf.map(subSchema => ResolveModelExample(subSchema, rootSchema)).join("\n");
    } else if (schema.allOf) {
        const subSchemas = schema.allOf.map(subSchema => ResolveModelExample(subSchema, rootSchema));
        const mergedKeys = new Set();
        const merged = {};
        subSchemas.forEach(subSchema => {
            Object.entries(subSchema).forEach(entry => {
                const [key, value] = entry;
                if (!mergedKeys.has(key)) {
                    mergedKeys.add(key);
                    merged[key] = value;
                }
            });
        })
        return merged;
    } else if (schema.anyOf) {
        return "Any of the following:\n" + schema.anyOf.map(subSchema => ResolveModelExample(subSchema, rootSchema)).join("\n");
    } else if (schema.type) {
        switch (schema.type) {
            case "string":
                if (schema.format) {
                    return `string (${schema.format})${AddStringConstraints(schema)}`;
                }
                return "string";
            case "number":
                if (schema.format) {
                    return `number (${schema.format})${AddNumericConstraints(schema)}`;
                }
                return "number";
            case "integer":
                if (schema.format) {
                    return `integer (${schema.format})${AddNumericConstraints(schema)}`;
                }
                return "integer";
            case "boolean":
                return "true | false";
            case "array":
                if (schema.items) {
                    return [ ResolveModelExample(schema.items, rootSchema) ];
                }
                return [];
            case "null":
                return "<null>";
            case "object":
                return Object.entries(schema.properties ? schema.properties : {})
                    .concat(Object.entries(schema.additionalProperties ? schema.additionalProperties : {}))
                    .reduce((accumulator, entry) => {
                        const [propertyName, propertySchema] = entry;
                        accumulator[propertyName] = ResolveModelExample(propertySchema, rootSchema);
                        return accumulator;
                    }, {});

            default:
                return schema;
        }
    }

    // If nothing matches, this can be anything.
    return {};
}

/**
 * Renders an object describing the data that should be used with an API.
 * 
 * @param {*} props React component properties.
 * @param {object} schema Example object to render.
 * @param {object} props.swaggerSpec Root Swagger specification document.
 */
export function SwaggerModelExample(props) {
    return (
        <SyntaxHighlighter language="json" style={docco}>
            {JSON.stringify(ResolveModelExample(props.schema, props.swaggerSpec), null, 2)}
        </SyntaxHighlighter>
    );
}

/**
 * Renders controls for taking user input for an API model/parameter/field.
 * 
 * @param {*} props React component properties.
 * @param {object} props.controlState Current state of inputs (shared amongst all inputs for an operation).
 * @param {Function} props.setControlState Function to update state of inputs.
 * @param {string} props.operationId Name of the parent operation of this field.
 * @param {object} props.parameter Swagger schema describing an operation parameter.
 * @param {object} props.swaggerSpec Root Swagger specification document.
 */
export function SwaggerModelFieldInput(props) {
    const controlState = props.controlState;
    const setControlState = props.setControlState;
    const schema = ResolveModelRefs(props.parameter.schema, props.swaggerSpec);

    if (schema.oneOf || schema.allOf || schema.anyOf) {
        return (
            <TextField
                id={`${props.operationId}-${props.parameter.name}`}
                label={props.parameter.name}
                variant="outlined"
                style={{width: "100%"}}
                onChange={debounceInput((event) => setControlState(event.target.value ? JSON.parse(event.target.value) : null))}
                value={controlState}
                multiline />
        );
    } else if (schema.type) {
        switch (schema.type) {
            case "number":
                return (
                    <TextField
                        id={`${props.operationId}-${props.parameter.name}`}
                        label={props.parameter.name}
                        variant="outlined"
                        style={{width: "100%"}}
                        onChange={debounceInput((event) => setControlState(parseFloat(event.target.value ? event.target.value : "0")))}
                        type="number" />
                );
            case "integer":
                return (
                    <TextField
                        id={`${props.operationId}-${props.parameter.name}`}
                        label={props.parameter.name}
                        variant="outlined"
                        style={{width: "100%"}}
                        onChange={debounceInput((event) => setControlState(parseInt(event.target.value ? event.target.value : "0")))}
                        type="number" />
                );
            case "boolean":
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={debounceInput((event) => setControlState(!!event.target.checked))}
                                value={props.parameter.name}
                                color="primary" />
                        }
                        label={props.parameter.name} />
                );
            case "null":
                return <Box fontFamily="Monospace" fontStyle="italic">null</Box>;
            case "string":
                return (
                    <TextField
                        id={`${props.operationId}-${props.parameter.name}`}
                        label={props.parameter.name}
                        variant="outlined"
                        style={{width: "100%"}}
                        onChange={debounceInput((event) => setControlState(event.target.value ? event.target.value : ""))}
                        multiline />
                );
            case "array":
            case "object":
            default:
                return (
                    <TextField
                        id={`${props.operationId}-${props.parameter.name}`}
                        label={props.parameter.name}
                        variant="outlined"
                        style={{width: "100%"}}
                        onChange={debounceInput((event) => setControlState((event.target && event.target.value) ? JSON.parse(event.target.value) : ""))}
                        multiline />
                );
        }
    }

    return (
        <div>
            <Box>Error - Unrecognized Type: </Box>
            <SyntaxHighlighter language="json" style={docco}>
                {JSON.stringify(props, null, 2)}
            </SyntaxHighlighter>
        </div>
    );
}