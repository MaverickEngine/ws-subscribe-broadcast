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
				if (!message.domain) {
					throw new Error('Missing domain');
				}
				if (!message.channel) {
					throw new Error('Missing channel');
				}
				switch (message.event) {
					case "subscribe":
						this.doSubscribe(socket, message);
						break;
					case "unsubscribe":
						this.doUnsubscribe(socket, message);
						break;
					case "broadcast":
						this.doBroadcast(socket, message);
						break;
					case "get_since":
						this.doGetSince(socket, message);
						break;
					case "get_since_date":
						this.doGetSinceDate(socket, message);
						break;
					case "get_since_id":
						this.doGetSinceId(socket, message);
						break;
					case "get":
						this.doGet(socket, message);
						break;
					case "get_by_id":
						this.doGetById(socket, message);
						break;
					case "get_by_index":
						this.doGetByIndex(socket, message);
						break;
					case "get_latest":
						this.doGetLatest(socket, message);
						break;
					default:
						break;
				}
            } catch (err) {
                console.error(err.toString());
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

	doSubscribe(socket, message) {
		socket.subscriptions.push({ domain: message.domain, channel: message.channel });
		socket.send(JSON.stringify({ event: 'subscribed', domain: message.domain, channel: message.channel }));
		console.log( `Subscribed to ${ message.channel } for ${ message.domain }` );
	}

	doUnsubscribe(socket, message) {
		socket.subscriptions = socket.subscriptions.filter((subscription) => {
			return subscription.domain !== message.domain || subscription.channel !== message.channel;
		});
		socket.send(JSON.stringify({ event: 'unsubscribed', domain: message.domain, channel: message.channel }));
		console.log( `Unsubscribed from ${ message.channel } for ${ message.domain }` );
	}

	doBroadcast(socket, message) {
		const messageObj = messages.add(message.domain, message.channel, message.message, socket.unique_id);
		this.broadcastMessage(messageObj, socket.unique_id);
		console.log( `Broadcasting to ${ message.channel } for ${ message.domain }` );
	}

	doGet(socket, message) {
		console.log('get', message.domain, message.channel);
		const messagesSince = messages.get(message.domain, message.channel);
		messagesSince.forEach((messageObj) => {
			socket.send(JSON.stringify(messageObj));
		});
	}

	doGetSince(socket, message) {
		const messagesSince = messages.getSince(message.domain, message.channel, message.since);
		messagesSince.forEach((messageObj) => {
			socket.send(JSON.stringify(messageObj));
		});
		console.log('get_since', message.domain, message.channel, message.since);
	}

	doGetSinceDate(socket, message) {
		console.log('get_since_date', message.domain, message.channel, message.since);
		const messagesSince = messages.getSince(message.domain, message.channel, new Date(message.since).getTime());
		messagesSince.forEach((messageObj) => {
			socket.send(JSON.stringify(messageObj));
		});
	}

	doGetSinceId(socket, message) {
		const messagesSince = messages.getSinceId(message.domain, message.channel, message.since_id);
		messagesSince.forEach((messageObj) => {
			socket.send(JSON.stringify(messageObj));
		});
		console.log('get_since_id', message.domain, message.channel, message.id);
	}

	doGetById(socket, message) {
		const messagesSince = messages.getOne(message.domain, message.channel, message.id);
		messagesSince.forEach((messageObj) => {
			socket.send(JSON.stringify(messageObj));
		});
		console.log('get_by_id', message.domain, message.channel, message.id);
	}

	doGetByIndex(socket, message) {
		const messageObj = messages.getByIndex(message.domain, message.channel, message.index);
		socket.send(JSON.stringify(messageObj));
		console.log('get_by_index', message.domain, message.channel, message.index);
	}

	doGetLatest(socket, message) {
		const messageObj = messages.getLatest(message.domain, message.channel);
		socket.send(JSON.stringify(messageObj));
		console.log('get_latest', message.domain, message.channel);
	}

	size() {
		return this.wss.clients.size;
	}
}
