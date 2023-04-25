# WS-Subscribe-Broadcast

This simple websocket server lets you subscribe to a domain and channel, and then lets you send and receive all broadcasts for that domain and channel. 

## Background

This Websocket Server was developed for a Daily Maverick Mavengine project that required multiple users' browsers to remain in sync with each other, either when a user made a change, or when the server made a change. Instead of building a specific solution for that project, we decided to build a generic subscribe-broadcast server that could be used for any project that required this functionality.

## Features

- Multiple sites can use the server by using their own "Domain".
- Multiple apps can use the server by using their own "Channel".
- A web browser can subscribe to one or more domains and channels.
- A browser can send a message that will be broadcast to all the other subscribers on the channel.
- A server can also send a message for broadcast through a POST request.
- There is limited history (currently 100 messages) that can be retrieved by a browser.

## Security

*_The system is not secure. Anyone can subscribe to any domain and channel._*

We suggest not posting any data over the websocket. We typically use it to announce that something has changed, but no data as to what exactly has changed. The browser then makes a request to the server to get the latest data.

## Communication model

![Communication model](https://raw.githubusercontent.com/MaverickEngine/ws-subscribe-broadcast/master/docs/wssb.png)

1. A browser connects to the server.

```bash
websocat "ws://localhost:3000/_ws/"
```

2. The browser gets a response that it has successfully connected. This inculdes a unique ID for the browser.

```json
{"event":"connected","message":"Connected to server","uid":"6441066c31e24e0b1a511980"}
```

3. A browser subscribes to a domain and channel.

```json
{ "event": "subscribe", "domain": "http://blah.com", "channel": "test" }
```

4. The browser gets a response that it has successfully subscribed.

```json
{"event":"subscribed","message":"Subscribed to http://blah.com/test","domain":"http://blah.com","channel":"test","uid":"6441066c31e24e0b1a511980"}
```

5. The browser broadcasts a message to a domain and channel.

```json
{ "event": "broadcast", "domain": "http://blah.com", "channel": "test", "message": "Hello" }
```

6. The message is broadcast to all the subscribers to that domain and channel, but not to the browser that sent the message.

```json
{"_id":"64410697a61e3f1cc6d357e0","data":"Hello","timestamp":"2023-04-20T09:32:07.977Z","sender":"6441066c31e24e0b1a511980","domain":"http://blah.com","channel":"test","event":"broadcast"}
```

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
{ "event": "broadcast", "domain": "http://blah.com", "channel": "test", "message": "blah" }
```

### Unsubscribe

```javascript
{ "event": "unsubscribe", "domain": "http://blah.com", "channel": "test" }
```

## Broadcast a message from outside a websocket

You can broadcast a message to a domain and channel by sending a POST request to the server, using the endpoint `/broadcast`.

```bash
curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:3000/broadcast"
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

## HTTP endpoints

### GET /

Displays this README.

### UPGRADE /_ws/ or /socket.io/

This is the websocket endpoint. You can connect to it using a websocket client.

### GET /stats/

Get basic stats

```bash
curl "http://localhost:3000/stats/"
```

```json
{
    "status": "ok",
    "time_running": 102,
    "sockets_open": 1,
    "message_count": 4
}
```

### POST /broadcast

Broadcast a message to a domain and channel.

```bash
curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:3000/broadcast"
```

```json
{
    "event": "broadcast",
    "data": {
        "_id": "6447eb6e77fb1a221c1ad75e",
        "data": "Hello",
        "timestamp": "2023-04-25T15:02:06.744Z",
        "sender": "::ffff:127.0.0.1",
        "domain": "http://blah.com",
        "channel": "test"
    },
    "domain": "http://blah.com",
    "channel": "test",
    "status": "ok"
}
```

## Wordpress VIP

This app is compatible with the [VIP Go](https://wpvip.com/documentation/vip-go/) platform.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT
