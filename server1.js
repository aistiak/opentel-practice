
const axios = require("axios") ;
const { trace } = require("@opentelemetry/api");
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin")
const { registerInstrumentations } = require("@opentelemetry/instrumentation")
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
// const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis');
const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis-4');

const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const redis = require("redis")


const provider = new NodeTracerProvider()

const zipkinExporter = new ZipkinExporter({
    serviceName: "service-1",
    url: "http://localhost:9411/api/v2/spans"
})

const spanProcessor = new SimpleSpanProcessor(zipkinExporter);
provider.addSpanProcessor(spanProcessor);


// Create a Jaeger exporter
const jaegerExporter = new JaegerExporter({
    serviceName: 'service-1',
    endpoint: 'http://localhost:14268/api/traces', // Replace with your Jaeger Collector URL
});

// Register the Jaeger exporter with the tracer provider
provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));


provider.register();

registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new ExpressInstrumentation(), new RedisInstrumentation()],
});

const express = require('express');
const { required } = require("nodemon/lib/config");


const app = express()

const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379, // Default Redis port
});

let isRedisConnected = false
async function connectToRedis() {
    if (!isRedisConnected) {
        await redisClient.connect()
        isRedisConnected = true
    }
}

app.get("/", (req, res) => {
    // Manual instrumentation for a specific operation
    const span = provider.getTracer('example-tracer').startSpan('manual-operation');
    // Your custom code logic here
    span.setAttribute('service.name', 'service-1');
    span.setAttribute('key1', 'value1');
    span.setAttribute('key2', 42);
    span.setAttribute('key3', true);


    span.end();

    // res.send('Operation completed');
    return res.sendStatus(200)
});


app.get('/set', async (req, res) => {
    await connectToRedis()
    const span = provider.getTracer('express-redis-app').startSpan('redis-operation');
    const { key, value } = req.query;
    console.log(redisClient)
    await redisClient.set(key, value)
    span.end()

    return res.status(200).json({ key, value });
})

app.get('/get', async (req, res) => {
    await connectToRedis()

    const key = req.query.key;
    const span = provider.getTracer('express-redis-app').startSpan('redis-operation');
    const value = await redisClient.get(key)
    // const { context, trace } = require('@opentelemetry/api');
    // const span2 = trace.getSpan(context.active());
    // console.log('Current span:', span2 ? span2.name : 'No active span');
    span.setAttribute('redis-key', key);
    span.setAttribute('redis-value', value);
    span.end()
    return res.status(200).json({ value })
})


app.get('/convert',async (req,res,next)=>{

    try {
        const amount = req.query.amount;

        console.log({amount})
        const span1 = provider.getTracer("service-1-tracer").startSpan("converter-api-tracer")
        const data = await axios({
            method : 'GET' ,
            url : 'http://localhost:3002' 
        })
    
        console.log(data.data)
        const rate = data.data.rate 
        span1.setAttribute("amount",amount) 
        span1.setAttribute("rate",rate) 
        span1.end()
        return res.status(200).json({
            amount : amount * rate 
        })
    }catch(e){
        next(e)
    }


});

app.listen(3001, () => {
    console.log(` -- server started on port 3001 -`)
})