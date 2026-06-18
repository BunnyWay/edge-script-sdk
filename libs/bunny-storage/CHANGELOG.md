# @bunny.net/storage-sdk

## 0.3.2

### Patch Changes

- 74e65d7: simplify internal get() date handling and upload() sig
- 8968009: move dotenv to devDependencies
- 27ffeca: handle throw on error for remove/removeDirectory
- d129a9d: simplify file internals: share StorageFile construction between get/list and add a named FileDownload type
- d129a9d: fix misleading 400 error message that mentioned uploading on every operation (get/list/download/remove)

## 0.3.1

### Patch Changes

- 755f117: Remove unseless double parse & console.error log
- 74cd7e9: Change the order of export to allow importing from commonjs context

## 0.3.0

### Minor Changes

- 6199c9e: Properly export ESM for Node & Deno

## 0.2.2

### Patch Changes

- ecaa70b: Small issue with url when getting file metadata

## 0.2.1

### Patch Changes

- dc07b56: Update README.md

## 0.2.0

### Minor Changes

- f479879: Adding the bunny-storage library preview
