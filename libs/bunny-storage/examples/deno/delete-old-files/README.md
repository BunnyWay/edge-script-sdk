# Delete Old Files Example

This example demonstrates how to delete files older than a specified number of days from a directory in Bunny Storage.

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
deno task start /backups 30
```

Arguments:

- `directory` - The directory to scan for old files
- `days` - Delete files older than this many days (default: 30)
