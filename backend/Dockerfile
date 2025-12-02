FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o restconf-proxy

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/restconf-proxy /usr/local/bin/restconf-proxy
EXPOSE 9000
ENTRYPOINT ["restconf-proxy"]
