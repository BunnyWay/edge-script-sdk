# File Upload Example

This example demonstrates how to upload a local file to Bunny Storage.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A Bunny Storage zone with API credentials

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set the required environment variables:

```bash
export BUNNY_STORAGE_API_KEY="your-storage-api-key"
export BUNNY_STORAGE_ZONE="your-storage-zone-name"
export BUNNY_STORAGE_REGION="de"  # Optional, defaults to "de" (Falkenstein)
```

## Running the Example

```bash
npm start -- ./local-file.txt /remote/path/file.txt
```

Arguments:

- `local-path` - The path to the local file to upload
- `remote-path` - The destination path in Bunny Storage
