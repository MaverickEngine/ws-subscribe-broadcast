# CHANGELOG

## v0.2.5
- npx ws-subscribe-broadcast
- Docker image

## v0.2.2
- Some reliability changes
- Change to node:lts-alpine
- v0.2

## v0.1.2
- Don't require trailing forwardslash
- Add "websocket" and "ws" to "socket.io" and "_ws" as possible websocket endpoints

## v0.1.1
- Fix bug that was sending 404s on the `/broadcast` endpoint
- Add a `/stats` endpoint for some basic stats
- Document the HTTP endpoints
- Show the readme if you hit the / endpoint

## v0.1.0
- Breaking change: Change `"event": "message"` to `"event": "broadcast"` for broadcasting a message (to allow for "message" to be a one-to-one message in the future)
- Breaking change: Broadcast POST endpoint changed from `/send` to `/broadcast`
- Improved documentation

## v0.0.3
- Some Jest testing
- Abstract the server into a class
- Add a `close` method to the server
- Add a `start` method to the server
- Ability to select a port
- A simple message queue
- `get_since` method to get messages since a timestamp
- `get_since_date` method to get messages since a date
- `get_since_id` method to get messages since a message ID
- `get` method to get all messages
- `get_by_id` method to get a message by ID
- `get_by_index` method to get a message by index
- `get_latest` method to get the latest message

## v0.0.2
- Add a web-accessible POST endpoint at `/send` to send a message to a domain and channel
- Allow a websocket to subscribe and unsubscribe to multiple domains and channels at once
- Improve documentation
- Give more examples when starting the server
- Started a Changelog!

## v0.0.1
- Initial release
- Subscribe and unsubscribe to a domain and channel
- Send a message to a domain and channel
- Docker support