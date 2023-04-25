import { WebSocketServer, WebSocket } from 'ws';
import messages from './messages.js';
import generate_id from './generate_id.js';

/**
 * A WebSocket server that alerts all connected 
 * clients when a front page is updated.
 */
export class FrontPageEngineSocketServer {

	/**
	 * WebSocketServer instance.
	 */
	wss = null;

	/**
	 * Constructor
	 */
	constructor() {
		/**
		 * Create a "headless" WebSocketServer that we will use to handle connection
		 * upgrade requests. When Express receives a request to upgrade to a websocket,
		 * we will pass it to this server instance.
		 */
		this.wss = new WebSocketServer( { noServer: true } );
	}

	/**
	 * Handle a newly connected client.
	 */
	onConnect( socket, req ) {
		socket.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		socket.unique_id = generate_id();
		console.log( `WebSocket connection established from ${ socket.ip }, uid ${ socket.unique_id }...` );
		socket.send( JSON.stringify( { event: 'connected', message: 'Connected to server', uid: socket.unique_id } ) );
		socket.on( 'close', this.onClose.bind( this ) );
		socket.on( 'message', (function(data) {
            try {
				if (!socket.subscriptions) {
					socket.subscriptions = [];
				}
				const s = data.toString().trim();
				if (s === '') {
					return;
				}
                const message = JSON.parse(s);
                if (message.event === 'subscribe') {
                    if (!message.domain || !message.channel) {
                        throw new Error('Invalid subscription');
                    }
                    socket.subscriptions.push({ domain: message.domain, channel: message.channel });
					socket.send(JSON.stringify({ event: 'subscribed', domain: message.domain, channel: message.channel }));
                    console.log( `Subscribed to ${ message.channel } for ${ message.domain }` );
                } else if (message.event === 'unsubscribe') {
                    if (!message.domain || !message.channel) {
						throw new Error('Invalid unsubscription');
					}
					socket.subscriptions = socket.subscriptions.filter((subscription) => {
						return subscription.domain !== message.domain || subscription.channel !== message.channel;
					});
					socket.send(JSON.stringify({ event: 'unsubscribed', domain: message.domain, channel: message.channel }));
                } else if (message.event === "broadcast") {
					const messageObj = messages.add(message.domain, message.channel, message.message, socket.unique_id);
					this.broadcastMessage(messageObj, socket.unique_id);
                } else if (message.event === "get_since") {
					console.log('get_since', message.domain, message.channel, message.since);
					const messagesSince = messages.getSince(message.domain, message.channel, message.since);
					messagesSince.forEach((messageObj) => {
						socket.send(JSON.stringify(messageObj));
					});
				} else if (message.event === "get_since_date") {
					console.log('get_since_date', message.domain, message.channel, message.since);
					const messagesSince = messages.getSince(message.domain, message.channel, new Date(message.since).getTime());
					messagesSince.forEach((messageObj) => {
						socket.send(JSON.stringify(messageObj));
					});
				} else if (message.event === "get_since_id") {
					console.log('get_since_id', message.domain, message.channel, message.id);
					const messagesSince = messages.getSinceId(message.domain, message.channel, message.since_id);
					messagesSince.forEach((messageObj) => {
						socket.send(JSON.stringify(messageObj));
					});
				} else if (message.event === "get") {
					console.log('get', message.domain, message.channel);
					const messagesSince = messages.get(message.domain, message.channel);
					messagesSince.forEach((messageObj) => {
						socket.send(JSON.stringify(messageObj));
					});
				} else if (message.event === "get_by_id") {
					const messagesSince = messages.getOne(message.domain, message.channel, message.id);
					messagesSince.forEach((messageObj) => {
						socket.send(JSON.stringify(messageObj));
					});
				} else if (message.event === "get_by_index") {
					const messageObj = messages.getByIndex(message.domain, message.channel, message.index);
					socket.send(JSON.stringify(messageObj));
				} else if (message.event === "get_latest") {
					const messageObj = messages.getLatest(message.domain, message.channel);
					socket.send(JSON.stringify(messageObj));
				}
            } catch (err) {
                console.log(err);
            }
        }).bind(this) );
	}

	/**
	 * Pass connection upgrade requests to the WebSocketServer.
	 */
	onConnectionUpgrade ( request, socket, head ) {
		this.wss.handleUpgrade( request, socket, head, this.onConnect.bind( this ) );
	}

	/**
	 * Handle any messages sent by connected clients.
	 */
	onMessage( message ) {
        console.log(message.data);
		console.log(`Received message from client: ${ message.toString() }`);
        // console.log(this.wss.clients);
	}

    onSubscribe( domain, event ) {
        console.log( `Subscribed to ${ event } for ${ domain }` );
    }

	/**
	 * Cleanup when a client disconnects.
	 */
	onClose() {
		// There are still clients connected.
		if ( this.wss.clients.size ) {
			return;
		}
	}

	broadcastMessage(message) {
		this.wss.clients.forEach((client) => {
			if (client.readyState !== WebSocket.OPEN) return false;
			if (!client.subscriptions) return false;
			if (message.sender === client.unique_id) return false;
			if (!client.subscriptions.find((subscription) => {
				return subscription.domain === message.domain && subscription.channel === message.channel;
			})) return false;
			message.event = 'broadcast';
			console.log(`Sending message to ${client.unique_id}...`);
			client.send(JSON.stringify(message));
		});
	}
}
