const { WebSocketServer, WebSocket } = require( 'ws' );

/**
 * A WebSocket server that alerts all connected 
 * clients when a front page is updated.
 */
class FrontPageEngineSocketServer {

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
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
		console.log( `WebSocket connection established from ${ ip }...` );

		socket.on( 'close', this.onClose.bind( this ) );
		socket.on( 'message', (function(data) {
            try {
				if (!socket.subscriptions) {
					socket.subscriptions = [];
				}
                const message = JSON.parse(data.toString());
                if (message.event === 'subscribe') {
                    if (!message.domain || !message.channel) {
                        throw new Error('Invalid subscription');
                    }
                    socket.subscriptions.push({ domain: message.domain, channel: message.channel });
                    console.log( `Subscribed to ${ message.channel } for ${ message.domain }` );
                } else if (message.event === 'unsubscribe') {
                    if (!message.domain || !message.channel) {
						throw new Error('Invalid unsubscription');
					}
					socket.subscriptions = socket.subscriptions.filter((subscription) => {
						return subscription.domain !== message.domain || subscription.channel !== message.channel;
					});
                } else if (message.event === "message") {
                    this.fireMessage(message.domain, message.channel, message.message);
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

		console.log( 'No more clients!' );
	}

	fireMessage( domain, channel, message ) {
		this.wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN && client.subscriptions) {
				if (client.subscriptions.find((subscription) => {
					return subscription.domain === domain && subscription.channel === channel;
				})) {
					client.send(JSON.stringify(message));
				}
			}
		});
	}
}

module.exports = FrontPageEngineSocketServer;
