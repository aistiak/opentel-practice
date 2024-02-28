const express = require("express");
const app = express();
const port = 3004;
const { trace , propagation , context} = require("@opentelemetry/api");
const crypto = require("crypto");
// Import and initialize OpenTelemetry
const sdk = require("./tracing");

app.get("/get-token", (req, res) => {

    const {
        traceparent,
        tracestate
    } = req.headers
    console.log({
        traceparent,
        tracestate
    })

    const tracer = trace.getTracer("app-two-tracer");
    const headers = { 'traceparent': traceparent };
    // const traceContext = propagation.extract({ traceparent }, propagation.B3Format);
    // console.log({traceContext})
    // Get the tracer
    const input = { traceparent , tracestate}
    let activeContext = propagation.extract(context.active(), input);
    console.log({activeContext})
    // Start a new span for the /getuser request
    const span = tracer.startSpan("/get-token",undefined,activeContext);


    try {

        const token = crypto.randomUUID()

        // Add attributes to the span if needed
        span.setAttribute("token", token);

        // Send the user data as a JSON response
        res.json(token);
    } catch (error) {
        // Record the error in the span
        span.recordException(error);

        // Respond with an error status code
        res.status(500).send(error.message);
    } finally {
        // End the span
        span.end();
    }
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Gracefully shut down the OpenTelemetry SDK and the server
const gracefulShutdown = () => {
    server.close(() => {
        console.log("Server stopped");
        sdk
            .shutdown()
            .then(() => console.log("Tracing terminated"))
            .catch((error) => console.error("Error shutting down tracing", error))
            .finally(() => process.exit(0));
    });
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
