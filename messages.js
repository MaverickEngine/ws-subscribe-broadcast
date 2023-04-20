import generate_id from './generate_id.js';

export class Message {
    _id;
    data;
    timestamp;
    sender;
    domain;
    channel;

    constructor(data, domain, channel, sender) {
        this._id = generate_id();
        this.data = data;
        this.timestamp = new Date();
        this.domain = domain;
        this.channel = channel;
        this.sender = sender;
    }
}

export class Messages {
    max_messages_per_channel = 100;

    constructor() {
        this.channels = {};
    }

    add(domain, channel, data, sender) {
        if (!this.channels[domain]) {
            this.channels[domain] = {};
        }
        if (!this.channels[domain][channel]) {
            this.channels[domain][channel] = [];
        }
        const message = new Message(data, domain, channel, sender);
        this.channels[domain][channel].push(message);
        while (this.channels[domain][channel].length > this.max_messages_per_channel) {
            this.channels[domain][channel].shift();
        }
        return message;
    }
    
    get(domain, channel) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel];
    }

    getSince(domain, channel, since) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel].filter((message) => {
            return message.timestamp > since;
        });
    }

    getSinceId(domain, channel, sinceId) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        const index = this.channels[domain][channel].findIndex((message) => {
            return message._id === sinceId;
        });
        return this.channels[domain][channel].slice(index + 1);
    }

    getLatest(domain, channel) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel][this.channels[domain][channel].length - 1];
    }

    getOne(domain, channel, id) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel].filter((message) => {
            return message._id === id;
        });
    }

    getByIndex(domain, channel, index) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel][index];
    }

    getExcludingSender(domain, channel, sender) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel].filter((message) => {
            return message.sender !== sender;
        });
    }

    getOneExcludingSender(domain, channel, id, sender) {
        if (!this.channels[domain]) {
            return [];
        }
        if (!this.channels[domain][channel]) {
            return [];
        }
        return this.channels[domain][channel].filter((message) => {
            return message._id === id && message.sender !== sender;
        });
    }
}

export default new Messages();