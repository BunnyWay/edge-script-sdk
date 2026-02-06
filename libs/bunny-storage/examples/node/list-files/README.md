# List Files Example

This example demonstrates how to list files and directories in a Bunny Storage zone.

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
npm start -- /path/to/directory
```

If no path is provided, it lists the root directory (`/`).
