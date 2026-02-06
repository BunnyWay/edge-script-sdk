# Delete File Example

This example demonstrates how to delete a single file from Bunny Storage.

## Prerequisites

- [Deno](https://deno.land/) installed
- A Bunny Storage zone with API credentials

### Installing Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

## Setup

Set the required environment variables:

```bash
export BUNNY_STORAGE_API_KEY="your-storage-api-key"
export BUNNY_STORAGE_ZONE="your-storage-zone-name"
export BUNNY_STORAGE_REGION="de"  # Optional, defaults to "de" (Falkenstein)
```

## Running the Example

```bash
deno task start /path/to/file.txt
```
