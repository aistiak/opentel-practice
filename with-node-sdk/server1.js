const express = require("express");
const app = express();
const port = 3000;
const { trace, context, propagation } = require("@opentelemetry/api");
const axios = require("axios") ;
const api = require('@opentelemetry/api');
const { AsyncHooksContextManager } = require('@opentelemetry/context-async-hooks');

const contextManager = new AsyncHooksContextManager();
contextManager.enable();
api.context.setGlobalContextManager(contextManager);
// Import and initialize OpenTelemetry
const sdk = require("./tracing");

app.get("/getuser", async (req, res) => {
  // Get the tracer
  const tracer = trace.getTracer("app-one-tracer");
  // Start a new span for the /getuser request
  const span = tracer.startSpan("/getuser");
  console.log(context.active())
  let output = {}
  const tokenSpanContext = trace.setSpan(context.active(), span);
  propagation.inject(tokenSpanContext, output);
  const { traceparent, tracestate } = output;
  console.log({output,traceparent,tracestate})

  

//   console.log(span.context())
  try {
      const tokenSpan = tracer.startSpan("/get-token",undefined,trace.setSpan(context.active(),span));
      const tokenData = await axios({
        url : 'http://localhost:3004/get-token',
        method : 'GET',
        headers : {
            traceparent ,
            tracestate
        }
      })
      const token = tokenData.data
      console.log({token})
      tokenSpan.end();
    // Simulate some processing
    const user = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      token
    };

    // Add attributes to the span if needed
    span.setAttribute("user.id", user.id);
    span.setAttribute("user.name", user.name);
    span.setAttribute("user.token", user.token);

    
    // Send the user data as a JSON response
    res.json(user);
  } catch (error) {
    console.log(error)
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
