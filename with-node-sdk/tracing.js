
const {NodeSDK} = require("@opentelemetry/sdk-node");
const {Resource} = require("@opentelemetry/resources");
const {SemanticResourceAttributes} = require("@opentelemetry/semantic-conventions")
const {getNodeAutoInstrumentations} = require("@opentelemetry/auto-instrumentations-node");
const {JaegerExporter} = require("@opentelemetry/exporter-jaeger");


const traceExporter = new JaegerExporter({
    // Jaeger agent UDP Thrift endpoint
    endpoint: "http://localhost:14268/api/traces",
    serviceName: "app-one", // Replace with your service name
  });
  

const sdk = new NodeSDK({
    traceExporter ,
    instrumentations : [getNodeAutoInstrumentations()] ,
    resource : new Resource({
        [SemanticResourceAttributes.SERVICE_NAME] : 'app-one'
    })
})


try {
    sdk.start() 
    console.log('Tracing initialized')
}catch(e){
    console.log('Error initializing tracing',e)
}