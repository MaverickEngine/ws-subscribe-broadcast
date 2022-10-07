# WS Subscribe Broadcast

This simple websocket server lets you subscribe to a domain and channel, and then lets you send and receive all broadcasts for that domain and channel. 

## Usage

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

### Subscribe to a domain and channel

```bash
websocat "ws://localhost:3000/_ws/"
```

### Send a broadcast

```javascript
{ "event": "subscribe", "domain": "http://blah.com", "channel": "test" }
{ "event": "message", "domain": "http://blah.com", "channel": "test", "message": "blah" }
```

## Wordpress VIP

This app is compatible with the [VIP Go](https://wpvip.com/documentation/vip-go/) platform.

## License

MIT
