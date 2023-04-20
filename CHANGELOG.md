# CHANGELOG

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