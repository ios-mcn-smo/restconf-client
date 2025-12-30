FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod .
COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -o restconf-proxy

FROM alpine:3.19
COPY --from=build /app/restconf-proxy /usr/local/bin/restconf-proxy
EXPOSE 9000
ENTRYPOINT ["restconf-proxy"]
