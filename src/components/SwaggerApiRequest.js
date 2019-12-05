function ResolveRequestPathParams(parameters, request) {
    if (!request.path) {
        return new Map();
    }

    return Object.entries(request.path)
        .reduce((accumulator, entry) => {
            const [key, value] = entry;
            const parameter = parameters.get(key);

            if (Array.isArray(value)) {
                switch (parameter.style) {
                    case "label":
                        accumulator.set(key, `.${value.join(parameter.explode ? "," : ".")}`);
                        return accumulator;
                    case "matrix":
                        if (parameter.explode) {
                            accumulator.set(key, `;${key}=${value.join(",")}`);
                            return accumulator;
                        } else {
                            accumulator.set(key, value.map(x => `;${key}=${x}`).join(""));
                            return accumulator;
                        }
                    case "simple":
                    default:
                        accumulator.set(key, value.join(","));
                        return accumulator;
                }
            } else if (typeof value === 'object' && value !== null) {
                switch (parameter.style) {
                    case "label":
                        if (parameter.explode) {
                            accumulator.set(key, Object.entries(value).map(entry => `.${entry[0]}=${entry[1]}`).join(""));
                            return accumulator;
                        } else {
                            accumulator.set(key, `.${Object.entries(value).flatMap(x => x).join(",")}`);
                            return accumulator;
                        }
                    case "matrix":
                        if (parameter.explode) {
                            accumulator.set(key, Object.entries(value).map(entry => `;${entry[0]}=${entry[1]}`).join(""));
                            return accumulator;
                        } else {
                            accumulator.set(key, `;${Object.entries(value).flatMap(x => x).join(",")}`);
                            return accumulator;
                        }
                    case "simple":
                    default:
                        if (parameter.explode) {
                            accumulator.set(key, Object.entries(value).map(entry => `${entry[0]}=${entry[1]}`).join(","));
                            return accumulator;
                        } else {
                            accumulator.set(key, Object.entries(value).flatMap(x => x).join(","));
                            return accumulator;
                        }
                }
            } else {
                switch (parameter.style) {
                    case "label":
                        accumulator.set(key, `.${value}`);
                        return accumulator;
                    case "matrix":
                        accumulator.set(key, `;${key}=${value}`);
                        return accumulator;
                    case "simple":
                    default:
                        accumulator.set(key, value);
                        return accumulator;
                }
            }
        },
        new Map());
}

function ResolveRequestQueryParams(parameters, request) {
    if (!request.query) {
        return [];
    }
    return Object.entries(request.query)
        .map(entry => {
            const [key, value] = entry;
            const parameter = parameters.get(key);

            if (Array.isArray(value)) {
                switch (parameter.style) {
                    case "spaceDelimited":
                        if (parameter.explode) {
                            return value.map(x => `${key}=${x}`).join("&");
                        } else {
                            return `${key}=${value.join("%20")}`;
                        }
                    case "pipeDelimited":
                        if (parameter.explode) {
                            return value.map(x => `${key}=${x}`).join("&");
                        } else {
                            return `${key}=${value.join("|")}`;
                        }
                    case "form":
                    default:
                        if (parameter.explode) {
                            return value.map(x => `${key}=${x}`).join("&");
                        } else {
                            return `${key}=${value.join(",")}`;
                        }
                }
            } else if (typeof value === 'object' && value !== null) {
                switch (parameter.style) {
                    case "deepObject":
                        if (parameter.explode) {
                            return Object.entries(value).map(entry => `${key}[${entry[0]}]=${entry[1]}`).join("&");
                        } else {
                            return `${key}=${Object.entries(value).flatMap(entry => entry).join(",")}`;
                        }
                    case "form":
                    case "pipeDelimited":
                    case "spaceDelimited":
                    default:
                        if (parameter.explode) {
                            return Object.entries(value).map(entry => `${entry[0]}=${entry[1]}`).join("&");
                        } else {
                            return `${key}=${Object.entries(value).flatMap(entry => entry).join(",")}`;
                        }
                }
            } else {
                return `${key}=${value}`;
            }
        });
}

function ResolveRequestHeaderParams(parameters, request) {
    if (!request.header) {
        return new Map();
    }

    return Object.entries(request.header)
        .reduce((accumulator, entry) => {
            const [key, value] = entry;
            const parameter = parameters.get(key);

            if (Array.isArray(value)) {
                accumulator.set(key, value.join(","));
            } else if (typeof value === 'object' && value !== null) {
                if (parameter.explode) {
                    accumulator.set(key, Object.entries(value).map(entry => `${entry[0]}=${entry[1]}`).join(","));
                } else {
                    accumulator.set(key, Object.entries(value).flatMap(entry => entry).join(","));
                }
            } else {
                accumulator.set(key, value);
            }
            return accumulator;
        }, new Map());
}

function ResolveRequestCookieParams(request) {
    if (!request.cookie) {
        return new Map();
    }

    return Object.entries(request.cookie)
        .reduce((accumulator, entry) => {
            const [key, value] = entry;

            if (Array.isArray(value)) {
                accumulator.set(key, `${key}=${value.join(",")}`);
            } else if (typeof value === 'object' && value !== null) {
                accumulator.set(key, `${key}=${Object.entries(value).flatMap(entry => entry).join(",")}`);
            } else {
                accumulator.set(key, `${key}=${value}`);
            }
            return accumulator;
        }, new Map());
}

/**
 * Sends a HTTP request for a corresponding Swagger API operation.
 * 
 * @param {string} method HTTP method of the request (GET, POST, PUT, DELETE, etc.).
 * @param {string} host URL prefix to use when building request.
 * @param {string} path Path of operation.
 * @param {object} operation Swagger schema describing operation.
 * @param {object} request Data to send in an object first keyed on data type (body, query, header,
 *     cookie, path) and then on parameter name (if applicable)
 */
export function MakeRequest(method, host, path, operation, request) {
    const parameters = operation.parameters ? operation.parameters.reduce((accumulator, param) => accumulator.set(param.name, param), new Map()) : new Map();

    const pathParameters = ResolveRequestPathParams(parameters, request);
    const queryParameters = ResolveRequestQueryParams(parameters, request);
    const headerParameters = ResolveRequestHeaderParams(parameters, request);

    const replacedPath = [...pathParameters.keys()].reduce((currentPath, pathParam) => currentPath.replace(`{${pathParam}}`, pathParameters.get(pathParam)), path);

    return fetch(
        `${host}${replacedPath}${queryParameters.length > 0 ? '?' + queryParameters.join("&") : ''}`,
        {
            method: method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'include',
            headers: [...headerParameters.entries()].reduce((obj, entry) => {
                obj[entry[0]] = entry[1];
                return obj;
            }, {}),
            referrer: 'no-referrer',
            body: JSON.stringify(request.body)
        }
    )
}


/**
 * Generates a curl command representing an api operation call.
 * 
 * @param {string} method HTTP method of the request (GET, POST, PUT, DELETE, etc.).
 * @param {string} host URL prefix to use when building request.
 * @param {string} path Path of operation.
 * @param {object} operation Swagger schema describing operation.
 * @param {object} request Data to send in an object first keyed on data type (body, query, header,
 *     cookie, path) and then on parameter name (if applicable)
 */
export function ResolveCurlRequest(method, host, path, operation, request) {
    const parameters = operation.parameters ? operation.parameters.reduce((accumulator, param) => accumulator.set(param.name, param), new Map()) : new Map();

    const pathParameters = ResolveRequestPathParams(parameters, request);
    const queryParameters = ResolveRequestQueryParams(parameters, request);
    const headerParameters = ResolveRequestHeaderParams(parameters, request);
    const cookieParameters = ResolveRequestCookieParams(request);

    const replacedPath = [...pathParameters.keys()].reduce((currentPath, pathParam) => currentPath.replace(`{${pathParam}}`, pathParameters.get(pathParam)), path);

    return `curl -X${method.toUpperCase()} \\\n    ${host}${replacedPath}`
        + (queryParameters.length > 0 ? '?' + queryParameters.join("&") : '')
        + [...headerParameters.values()].map(x => ` \\\n    -H ${x}`).join("")
        + [...cookieParameters.values()].map(x => ` \\\n    --cookie ${x}`).join("")
        + (request.body ? ` \\\n    -d \\\n'${JSON.stringify(request.body, null, 4)}'` : '');
}
