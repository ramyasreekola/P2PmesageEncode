const createNode = require('./index');
const fs = require('fs');
const assert = require('assert');

describe('createNode', () => {
    it('should create a new node', () => {
        const node = createNode();
        assert(node);
    });

    it('should listen on a specified port', () => {
        const node = createNode();
        const port = 3000;
        node.listen(port, () => {
            assert.equal(node.listeningPort(), port);
        });
    });


    it('should connect to another node', () => {
        const node1 = createNode();
        const node2 = createNode();
        node2.listen(3004, () => {
            node2.on('connect', ({ nodeId }) => {
                const peers = [...node2.neighbors()];
                assert(peers.includes(nodeId));
            });
        });
        node1.listen(3005, () => { });
        node2.connect('0.0.0.0', 3005, () => {

        });


    });

    it('should broadcast a message to all nodes', () => {
        const node1 = createNode();
        const node2 = createNode();
        const port = 3001;
        const message = 'Hello, world!';

        node1.listen(port, () => {
            node2.connect('0.0.0.0', port, () => {
                node1.broadcast({ name: 'Alice', text: message });
            });
        });

        node2.on('broadcast', ({ message: { name, text } }) => {
            assert.equal(name, 'Alice');
            assert.equal(text, message);
        });
    });

    it('should send a direct message to a specific node', () => {
        const node1 = createNode();
        const node2 = createNode();
        const port = 3002;
        const message = 'Hello, world!';


        node2.listen(3003, () => {
            node2.on('connect', ({ nodeId }) => {
                node2.direct(nodeId, { name: 'Alice', text: message });
            });
        });
        node1.listen(port, () => {
            node2.connect('0.0.0.0', port, () => {

            });
        });

        node2.on('direct', ({ origin, message: { name, text } }) => {

            assert.equal(name, 'Alice');
            assert.equal(text, message);
        });
    });

    it('should load a file and send it to a specific node', () => {
        const node1 = createNode();
        const node2 = createNode();
        const filepath = 'input/sample.txt';
        const filename = filepath.substring(filepath.lastIndexOf('/') + 1);

        node2.listen(3008, () => {
            node2.on('connect', ({ nodeId }) => {
                fs.readFile(filepath, (err, data) => {
                    if (err) throw err;
                    node1.sendEncodedMessage(data, nodeId, filename);
                });
            });
        });
        node1.listen(3007, () => { });
        node2.connect('0.0.0.0', 3007, () => {

        });
        node2.on('direct', ({ origin, message: { name, text } }) => {
            assert.equal(origin, node1.id);
            assert.equal(name, 'test.txt');
            assert.equal(text, 'This is a test file.');
        });
    });


    it('should encode and decode a message', () => {
        const payload = { foo: 'bar' };
        const encodedMessage = peer1.messageEncode(payload);
        const decodedMessage = peer1.messageDecode(encodedMessage);

        expect(decodedMessage.payload).toEqual(Buffer.from(JSON.stringify(payload)));
    });

    it('should send an encoded message to a peer', (done) => {
        peer1.listen(3000);
        peer2.connect('localhost', 3000);

        const payload = { foo: 'bar' };

        peer1.on('direct', ({ origin, message }) => {
            const decodedMessage = peer1.messageDecode(message);
            expect(origin).toEqual(peer2.id);
            expect(decodedMessage.payload).toEqual(Buffer.from(JSON.stringify(payload)));
            done();
        });

        peer2.sendEncodedMessage(payload, peer1.id);
    });
});