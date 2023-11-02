const net = require('net');
const EventEmitter = require('events');
const fs = require('fs');
const splitStream = require('./split-stream');
const { validatePayloadSize, validateHeaders } = require('./utils.js');

// Define a helper to generate random node id
const random4digithex = () => Math.random().toString(16).split('.')[1].substr(0, 4);
const randomuuid = () => new Array(8).fill(0).map(() => random4digithex()).join('-');

// Define the Message object with encoding and decoding methods
const Message = {
    encode: (message) => {
        const headers = new Map();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', 'Bearer 1234567890');
        headers.set('User-Agent', 'MyApp/1.0.0');

        validatePayloadSize(message.payload);
        validateHeaders(message.headers);
        const base64EncodedPayload = message.payload.toString('base64');
        return { headers: message.headers, payload: base64EncodedPayload };
    },
    decode: (message) => {
        const decodedPayload = Buffer.from(message.payload, 'base64');
        return { headers: message.headers, payload: decodedPayload };
    },
};

module.exports = (options) => {
    const connections = new Map();
    const emitter = new EventEmitter();
    let listeningPort = 0;
    const NODE_ID = randomuuid();
    const neighbors = new Map();
    const alreadySeenMessages = new Set();

    const handleNewSocket = (socket) => {
        const connectionId = randomuuid();

        connections.set(connectionId, socket);
        emitter.emit('_connect', connectionId);

        socket.on('close', () => {
            connections.delete(connectionId);
            emitter.emit('_disconnect', connectionId);
        });

        socket.pipe(splitStream()).on('data', (message) => {
            if (message.type === 'message' && message.data.messageFormat === 'base64Encoded') {
                const decodedMessage = Message.decode(message.data.message);
                const outputPath = getOutputPath(message.data.filename);
                writeByteStreamToFile(decodedMessage.payload, outputPath);
            }

            emitter.emit('_message', { connectionId, message });
        });
    };

    const server = net.createServer((socket) => handleNewSocket(socket));

    const _send = (connectionId, message) => {
        const socket = connections.get(connectionId);

        if (!socket) {
            throw new Error(`Attempt to send data to a non-existent connection: ${connectionId}`);
        }

        socket.write(JSON.stringify(message));
    };

    const connect = (ip, port, cb) => {
        const socket = new net.Socket();

        socket.connect(port, ip, () => {
            handleNewSocket(socket);
            cb && cb();
        });

        return (cb) => socket.destroy(cb);
    };

    const listen = (port, cb) => {
        server.listen(port, '0.0.0.0', cb);
        listeningPort = port;
        return (cb) => server.close(cb);
    };

    const close = (cb) => {
        for (let [connectionId, socket] of connections) {
            socket.destroy();
        }

        server.close(cb);
    };

    const findNodeId = (connectionId) => {
        for (let [nodeId, $connectionId] of neighbors) {
            if (connectionId === $connectionId) {
                return nodeId;
            }
        }
    };

    emitter.on('_connect', (connectionId) => {
        _send(connectionId, { type: 'handshake', data: { nodeId: NODE_ID } });
    });

    emitter.on('_message', ({ connectionId, message }) => {
        const { type, data } = message;

        if (type === 'handshake') {
            const { nodeId } = data;
            neighbors.set(nodeId, connectionId);
            emitter.emit('connect', { nodeId });
        }

        if (type === 'message') {
            const nodeId = findNodeId(connectionId);

            if (!nodeId) {
                throw new Error(`Could not find nodeId from neighbors`);
            }
            emitter.emit('message', { nodeId, data });
        }
    });

    emitter.on('_disconnect', (connectionId) => {
        const nodeId = findNodeId(connectionId);

        neighbors.delete(nodeId);
        emitter.emit('disconnect', { nodeId });
    });

    const send = (nodeId, data) => {
        const connectionId = neighbors.get(nodeId);

        if (!connectionId) {
            throw new Error(`Could not find connectionId from neighbors`);
        }

        _send(connectionId, { type: 'message', data });
    };

    const sendPacket = (packet) => {
        for (const $nodeId of neighbors.keys()) {
            send($nodeId, packet);
        }
    };

    const broadcast = (message, id = randomuuid(), origin = NODE_ID, ttl = 255) => {
        sendPacket({ id, ttl, type: 'broadcast', message, origin });
    };

    const direct = (destination, message, filename, messageFormat, id = randomuuid(), origin = NODE_ID, ttl = 255) => {
        sendPacket({ id, ttl, type: 'direct', message, destination, origin, messageFormat, filename });
    };

    const sendEncodedMessage = (payload, destinationNodeId, filename) => {
        const encodedMessage = Message.encode(payload);
        direct(destinationNodeId, encodedMessage, filename, 'base64Encoded');
    };

    function getOutputPath(fileName) {
        return 'output/recovered_' + fileName;
    }

    function writeByteStreamToFile(byteStream, outputPath) {
        fs.writeFile(outputPath, byteStream, (err) => {
            if (err) {
                console.error(err);
                throw new Error(`Failed to write file: ${outputPath}`);
            } else {
                console.log(`File successfully saved at: ${outputPath}`);
            }
        });
    }

    emitter.on('message', ({ nodeId, data: packet }) => {
        if (alreadySeenMessages.has(packet.id) || packet.ttl < 1) {
            return;
        } else {
            alreadySeenMessages.add(packet.id);
        }

        if (packet.type === 'broadcast') {
            emitter.emit('broadcast', { message: packet.message, origin: packet.origin });
            broadcast(packet.message, packet.id, packet.origin, packet.ttl - 1);
        }

        if (packet.type === 'direct') {
            if (packet.destination === NODE_ID) {
                emitter.emit('direct', { origin: packet.origin, message: packet.message });
            } else {
                direct(packet.destination, packet.message, packet.id, packet.origin, packet.ttl - 1);
            }
        }
    });

    return {
        listen,
        connect,
        close,
        broadcast,
        direct,
        sendEncodedMessage,
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        id: NODE_ID,
        neighbors: () => neighbors.keys(),
        listeningPort: () => listeningPort,
    };
};
