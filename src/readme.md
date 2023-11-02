# P2P Message Encode


A Javascript, NodeJs P2P communication system where you can send broadcast/direct messages between peers using TCP Socket communicatiopn. The messsages can either text or a file, whose binary payload contents are encoded before sending them between peers in the network

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Configuration](#configuration)
- [License](#license)

## Installation

Before running this app, install the required dependencies. Make sure to install jest if you want to run the unit tests as well.

```bash
# Example installation steps
npm install events express http net readline 
npm install jest --save-dev
```

## Usage
To use this application you have to set up atleast two peers running as two seperate node instances. Run several instances to create a happy network :)

```bash
# Example usage
node src/app.js 3000 Peer1
```
Once you setup two instances, You can start with connecting to a peer the commandline suggested usage

```bash

connect 0.0.0.0:3001
```
The command line logs a node id of the peer thats connected to you. Use that node id if you want to send a message specific to the peer. For broadcasting a message the node id wont be necessary. To send a file(for encoding) you can choose a file from the input folder.
```
  direct NodeId Hello World!
  broadcast Hej Allihopa!
  load NodeId input/filname.extension
```

## Features

This project sets up a P2P networking layer with message encoding and decoding capabilities. Lets you run a Node.js module that exports a function, which, when called, creates and returns an instance of the P2P network. Some main capabilities are:

1. **Message Encoding and Decoding**: A `Message` object is defined with `encode` and `decode` methods. These methods handle the encoding and decoding of message payloads using Base64 encoding. This ensures that messages adhere to the specified format.

2. **API Exposed via Event Emitter**: This P2P network is designed to work as an event emitter, allowing users to listen for and respond to various events like 'connect,' 'message,' and 'disconnect.' This is a flexible and familiar pattern for working with event-driven systems.

3. **Network Layer Functionality**: Contains functions for starting and closing the server, establishing connections to other nodes, sending messages, and broadcasting messages. These methods provide a high-level interface for working with the P2P network.

4. **Message Handling And File Handling**: The code handles incoming messages, including message forwarding for both broadcast and direct messages. It also keeps track of seen messages to prevent duplicates.Includes a method to write byte streams to files, which is useful for saving received binary data to disk.

5. **Error Handling**: Covers scenarios, such as handling nonexistent connections, payload size validation, and header validation adhering the assignment requirements.

6. **Random Node ID Generation**: generate random node IDs using a combination of four-digit hex values. For a production environment, this can be scoped to use more randomness for the peers.


## Configuration

TODO - Explain how to configure project, including any configuration files or settings that the user can modify.

- Configuration File: `config.js`
- Configuration Options: Describe available options

## Commands

A list of available commands that the user can use within the project.

- `connect IP:PORT`: Connect to another peer.
- `direct NodeId MESSAGE`: Send a direct message to a peer.
- `broadcast MESSAGE`: Send a message to everyone in the network.
- `load NodeId FILEPATH`: Load a file and send it to a peer.

## Notes to self
 Add more extensive error handling, logging, and security measures depending on your specific use case and deployment requirements. Additionally, you might consider adding documentation or comments to make it easier for others to understand and use your code.

## TIL
 - A Buffer is a low-level representation of binary data in Node.js, which can be converted to a string or other formats as needed.

- emitter.emit('eventName' , ...args1,2,3) - CALLOUT -> Synchronously calls each of the listeners registered for the event namedeventName, in the order they were registered, passing the supplied arguments to each.

- emitter.on('eventName', function cb(args1,2) => {}) - CALLBACK REGISTERS -> Adds the listener function to the end of the listeners array for the event named eventName.