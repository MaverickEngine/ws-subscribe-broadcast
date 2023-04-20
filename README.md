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

## Get historical messages

### get

Get all messages.

```javascript
{ "event": "get", "domain": "http://blah.com", "channel": "test" }
```

### get_since

Get all messages since a timestamp.

```javascript
{ "event": "get_since", "domain": "http://blah.com", "channel": "test", "since": "1577836800000" }
```

### get_since_date

Get all messages since a date.

```javascript
{ "event": "get_since_date", "domain": "http://blah.com", "channel": "test", "since": "2020-01-01" }
```

### get_by_id

Get a message by ID.

```javascript
{ "event": "get_by_id", "domain": "http://blah.com", "channel": "test", "id": "644005ae9dfd5ec3247d163a" }
```

### get_since_id

Get all messages since a message ID.

```javascript
{ "event": "get_since_id", "domain": "http://blah.com", "channel": "test", "since_id": "644007857a34daaf6c82b942" }
```

### get_by_index

Get a message by index.

```javascript
{ "event": "get_by_index", "domain": "http://blah.com", "channel": "test", "index": 1 }
```

### get_latest

Get the latest message.

```javascript
{ "event": "get_latest", "domain": "http://blah.com", "channel": "test" }
```

## Wordpress VIP

This app is compatible with the [VIP Go](https://wpvip.com/documentation/vip-go/) platform.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT
