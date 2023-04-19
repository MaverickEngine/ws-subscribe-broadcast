const http = require( 'http' );
const { parse } = require('querystring');
const FrontPageEngineSocketServer = require( './websocket' );

const PORT = process.env.PORT || 3000;

// Create a single, shared WebSocket server.
const socketServer = new FrontPageEngineSocketServer();

const app = http.createServer( ( req, res ) => {
	const baseUrl = `http://${ req.headers.host }`;
	const { pathname: requestPath } = new URL( req.url, baseUrl );

	if ( '/' === requestPath && [ 'GET', 'HEAD' ].includes( req.method ) ) {
		res.writeHead( 200 );
        res.end( 'Howdy!' );
		return;
	}

	/**
	 * An http callback that you can use to send a websocket event to a specific
	 * domain and channel.
	 * 
	 * Test: curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:3000/send"
	 */
	if ( '/send' === requestPath && [ 'POST', 'HEAD' ].includes( req.method ) ) {
		try {
			let body = '';
    		req.on('data', chunk => {
        		body += chunk.toString(); // convert Buffer to string
    		});
    		req.on('end', () => {
				try {
					const { domain, channel, message } = parse(body);
					console.log( `Sending message to ${ channel } for ${ domain }` );
					socketServer.fireMessage(domain, channel, message);
					res.end('ok');
				} catch (err) {
					res.writeHead( 500 );
					res.end( err.message || err );
				}
    		});
		} catch ( err ) {
			res.writeHead( 500 );
			res.end( 'Internal server error' );
			return;
		}
	}

	/**
	 * Handle health checks
	 * https://docs.wpvip.com/technical-references/vip-platform/node-js/
	 *
	 * This is a requirement for any application running on WordPress VIP:
	 *
	 * - must handle url "/cache-healthcheck?" with trailing question mark
	 * - must respond with a 200 status code
	 * - must send a short response (e.g., "ok")
	 * - must respond immediately, without delay
	 * - must prioritize this above other routes
	 *
	 * Test: curl -v "https://example.com/cache-healthcheck?"
	 */
	if ( '/cache-healthcheck' === requestPath && [ 'GET', 'HEAD' ].includes( req.method ) ) {
		res.writeHead( 200 );
		res.end( 'ok' );
		return;
	}

	res.writeHead( 404 );
	res.end();
} );

app.on( 'listening', () => {
	console.log( 'App is listening on port:', PORT );
	console.log( 'Try this command in another terminal window to open a websocket:' );
	console.log( `websocat "ws://localhost:${ PORT }/_ws/"\n` );
	console.log( 'Subscribe to a channel:' );
	console.log( `{ "event": "subscribe", "domain": "http://blah.com", "channel": "test" }\n` );
	console.log( 'Send a message to a channel:' );
	console.log( `{ "event": "message", "domain": "http://blah.com", "channel": "test", "message": "Hello" }\n` );
	console.log( 'Send a message via the http endpoint (in another terminal):' );
	console.log( `curl -X POST -d "domain=http://blah.com&channel=test&message=Hello" "http://localhost:${ PORT }/send"\n` );
	console.log( 'Unsubscribe from a channel:' );
	console.log( `{ "event": "unsubscribe", "domain": "http://blah.com", "channel": "test" }\n` );
} );

app.on( 'upgrade', ( req, socket, head ) => {
	const baseUrl = `http://${ req.headers.host }`;
	const { pathname: requestPath } = new URL( req.url, baseUrl );
    if ( requestPath.startsWith( '/socket.io/' ) || requestPath.startsWith( '/_ws/' ) ) {
		socketServer.onConnectionUpgrade( req, socket, head );
        return;
    }
	// WebSocket connections are not supported on VIP at any other path.
    socket.destroy();
} );

app.listen( PORT );
