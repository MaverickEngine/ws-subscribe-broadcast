import WebSocket from 'ws';
import {server} from '../server.js';
const port = 5555;
const domain = 'http://localhost:5555';
const channel = 'test';

const mock_messages = [
    "Test message 1",
    "Test message 2",
    "Test message 3",
    "Test message 4",
]

const connectClient = (messages) => {
    return new Promise((resolve, reject) => {
        const websocket = new WebSocket(`ws://localhost:${port}/_ws/`);
        websocket.on('open', () => {
            console.log('connected');
        });
        websocket.on('message', (raw) => {
            const message = JSON.parse(raw);
            messages.push(message);
            console.log("Got message", message);
            if (message.event === 'connected') {
                let uid = message.uid;
                // Subscribe to the test channel
                websocket.send(JSON.stringify({event: "subscribe", domain, channel}));
                resolve({websocket, uid});
            }
        });
    });
}

const sendMessageNewClient  = (data) => {
    return new Promise((resolve, reject) => {
        const websocket = new WebSocket(`ws://localhost:${port}/_ws/`);
        websocket.on('open', () => {
            
        });
        websocket.on('message', (raw) => {
            const message = JSON.parse(raw);
            if (message.event === 'connected') {
                console.log("Sending message", data);
                websocket.send(JSON.stringify({event: "broadcast", domain, channel, message: data }));
                // websocket.close();
                resolve();
            }
        });
    });
}

const awaitMessage = async (messages, data) => {
    const timeout = 2000;
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            // console.log(messages);
            const message = messages.find((message) => message.event === "broadcast" && message.data === data);
            if (message) {
                clearInterval(interval);
                resolve(message);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            reject('Timeout');
        }, timeout);
    });
}

const awaitMessageEvent = async (messages, event) => {
    const timeout = 2000;
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            // console.log(messages);
            const message = messages.find((message) => message.event === event);
            if (message) {
                clearInterval(interval);
                resolve(message);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            reject('Timeout');
        }, timeout);
    });
}

beforeAll(async () => {
    // Start the server
    server.port = port;
    await server.start();
});

afterAll(async () => {
    // Stop the server
    await server.stop();
});

describe('My WebSocket app', () => {
    let websocket;
    let uid;
    let messages = [];

    beforeEach(async () => {
        messages = [];
        ({ websocket, uid } = await connectClient(messages));
        for(const message of mock_messages) {
            await sendMessageNewClient(message);
        }
    });

    test('should connect', () => {
        expect(websocket).toBeTruthy();
        expect(uid).toBeTruthy();
    });

    test('should send and receive a message', async () => {
        const message = 'Hello';
        await sendMessageNewClient(message);
        const received_message = await awaitMessage(messages, message);
        expect(received_message.data).toBe(message);
    });
});