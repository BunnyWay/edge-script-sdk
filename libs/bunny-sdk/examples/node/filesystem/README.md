# Node File System Example

This example shows how to use the
[`node:fs/promises`](https://docs.bunny.net/scripting/node/fs/node-fs) module
inside a Bunny Edge Script. It implements a simple visit counter persisted to
`/tmp/counter.txt`.

The Bunny edge runtime exposes a sandboxed virtual file system rooted at `/`
with read/write access under `/tmp/` and `/home/user/` (64 MB total per
script).

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ installed

## Setup

Install dependencies:

```bash
npm install
```

Optional environment variables:

```bash
export PORT="8080"  # Local port (defaults to 8080)
```

## Running Locally

```bash
npm start
```

Then in another terminal:

```bash
# Increment the counter
curl http://127.0.0.1:8080/

# Reset the counter
curl -X POST http://127.0.0.1:8080/reset
```

Each request reads `/tmp/counter.txt`, increments the value, and writes it
back. The response also includes `fs.stat()` metadata for the counter file.

## Deploying to Bunny Edge

Push this script to a Bunny Edge Scripting project. The same code runs against
the edge sandbox — note that:

- File I/O counts toward the 30-second per-request CPU time limit
- Total file system capacity is 64 MB per script
- File watchers, symlinks, and `chmod`/`chown` are not supported
