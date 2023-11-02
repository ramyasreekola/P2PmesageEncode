const MAX_HEADERS = 63;
const MAX_HEADER_SIZE = 1023;
const MAX_PAYLOAD_SIZE = 256 * 1024; // 256 KiB

function validatePayloadSize(payload) {
  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new Error('Message payload size exceeds the limit.');
  }
}

function validateHeaders(headers) {
  if (headers.size > MAX_HEADERS) {
    throw new Error('Message has too many headers.');
  }

  headers.forEach((value, name) => {
    if (!isASCIIString(name) || !isASCIIString(value)) {
      throw new Error('Header names and values must be ASCII-encoded strings.');
    }

    if (name.length > MAX_HEADER_SIZE || value.length > MAX_HEADER_SIZE) {
      throw new Error('Header names and values exceed the size limit.');
    }
  });
}

function isASCIIString(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

module.exports = {
    validatePayloadSize,
    validateHeaders,
  };