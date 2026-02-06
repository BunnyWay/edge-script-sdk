# Batch Upload Example

This example demonstrates how to upload an entire directory (including subdirectories) to Bunny Storage.

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
npm start -- ./local-folder /remote-folder
```

Arguments:

- `local-directory` - The local directory to upload
- `remote-directory` - The destination directory in Bunny Storage (default: `/`)
