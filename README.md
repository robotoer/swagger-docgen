# SwaggerDocs

This simple React app generates documentation and a "try-it-out" interface from a provided swagger specification.

To run the application, use:

    npm start

And send your browser to http://localhost:3000/

To build the application, use:

    npm run build

## Caveats

Unfortunately I did not get around to implementing API authentication, but this is a relatively simple addition
requiring a few more UI components to display the different authentication styles and a place for the user to
enter their credentials (api-key, or otherwise). A simple oauth2 token generator tool could also serve some use
here.
