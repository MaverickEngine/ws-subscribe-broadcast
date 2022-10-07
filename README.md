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

### Send a broadcast

```javascript
{ "event": "message", "domain": "http://blah.com", "channel": "test", "message": "blah" }
```

The broadcast will be echoed back if you've subscribed to it too.

## Wordpress VIP

This app is compatible with the [VIP Go](https://wpvip.com/documentation/vip-go/) platform.

## License

MIT
