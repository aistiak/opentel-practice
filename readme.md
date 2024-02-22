## basic opentel example


### run zepkin

```
docker run -d -p 9411:9411 --name zipkin openzipkin/zipkin

```

### run jegger

```
docker run -d --name jaeger-all-in-one -p 16686:16686 -p 14268:14268 jaegertracing/all-in-one

```