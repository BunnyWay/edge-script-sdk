# Download File Example

This example demonstrates how to download a file from Bunny Storage to your local filesystem.

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
npm start -- /remote/path/file.txt ./local-file.txt
```

Arguments:

- `remote-path` - The path to the file in Bunny Storage
- `local-path` - The local path where the file will be saved
