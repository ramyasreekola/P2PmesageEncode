const createNode = require('./index');
const fs = require('fs');


// Helper function to parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node src/app.js PORT PEER_NAME');
        process.exit(1);
    }
    return { port: Number(args[0]), name: args[1] };
}

const { port, name } = parseArgs();

if (isNaN(port) || !name) {
    console.log('Port/Peer name not defined. Run "node src/app.js PORT PEER_NAME"');
    return;
}

const node = createNode();

node.listen(port, () => {
    console.log(`A peer is up at port ${port}.`);
    console.log('Commands: (Start by connecting to another peer before sending messages.))');
    console.log('  connect IP:PORT - Connect to another peer.');
    console.log('  direct NodeId MESSAGE - Send a direct message to a peer.');
    console.log('  broadcast MESSAGE - Send a message to everyone in the network.');
    console.log('  load NodeId FILEPATH - Load a file and send it to a peer.');


    node.on('connect', ({ nodeId }) => {
        console.log(`Node ${nodeId} has connected.`);
    });

    node.on('broadcast', ({ message: { name, text } }) => {
        console.log(`${name}: ${text}`);
    });

    node.on('direct', ({ message: { name, text } }) => {
        console.log(`${name}: ${text}`);
    });

    process.stdin.on('data', handleUserInput);
});

process.on('SIGINT', async () => {
    console.log("\nGracefully shutting chat node down...");

    node.close(() => {
        process.exit();
    });
});

function handleUserInput(data) {
    const text = data.toString().trim();

    if (text.startsWith('connect')) {
        const [, ipport] = text.split(' ');
        const [ip, port] = ipport.split(':');

        console.log(`Connecting to ${ip} at ${Number(port)}...`);
        node.connect(ip, Number(port), () => {
            console.log(`Connection to ${ip} established at ${port}.`);
        });

    } else if (text.startsWith('direct')) {
        const [, nodeId, ...message] = text.split(' ');

        console.log(`Sending direct message to ${nodeId}`);
        node.direct(`${nodeId}`, { name, text: message.join(' ') });

    } else if (text.startsWith('load')) {
        const [, nodeId, filepath] = text.split(' ');
        readAndSendFile(filepath, nodeId)

    } else if (text.startsWith('broadcast')) {
        const [, ...message] = text.split(' ');
        node.broadcast({ name, text: message.join(' ') });
    } else {
        console.log(`Unknown command: ${text}`);
    }
}

function readAndSendFile(filepath, nodeId) {
    const filename = filepath.substring(filepath.lastIndexOf('/') + 1);
    fs.readFile(filepath, function (err, data) {
        if (err) {
            console.error(err);
            throw new Error(`Failed to read file: ${filepath}`);
        } else {
            try { node.sendEncodedMessage(data, nodeId, filename); }
            catch (error) {
                console.log(error);
            }
        }
    });

}
