# WS Subscribe Broadcast

This simple websocket server lets you subscribe to a domain and channel, and then lets you send and receive all broadcasts for that domain and channel. 

## Running

### Start the server

```bash
$ npm install
$ npm start
```

### Run with Docker

```bash
$ docker build -t ws-subscribe-broadcast .
$ docker run -p 3000:3000 ws-subscribe-broadcast
```

## Usage

To test from the command line, you can use websocat:

```bash
websocat "ws://localhost:3000/_ws/"
```

### Subscribe to a domain and channel

```javascript
{ "event": "subscribe", "domain": "http://blah.com", "channel": "test" }
```

_Note: You can subscribe to multiple domains and channels at once._

### Send a broadcast

```javascript
{ "event": "message", "domain": "http://blah.com", "channel": "test", "message": "blah" }
```

### Unsubscribe

```javascript
{ "event": "unsubscribe", "domain": "http://blah.com", "channel": "test" }
```

## Send a message from outside a websocket

You can send a message to a domain and channel by sending a POST request to the server, using the endpoint `/send`.

```bash
curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:3000/send"
```

## Wordpress VIP

This app is compatible with the [VIP Go](https://wpvip.com/documentation/vip-go/) platform.

## License

MIT
