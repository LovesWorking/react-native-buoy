# Expo FileSystem Complete API Guide for React Native (iOS & Android)

> **Package Location:** `packages/expo-file-system/`
> **Version:** 19.0.14
> **Platforms:** iOS, Android (Web is NOT supported)

---

## Table of Contents

### Quick Start
- [Installation](#installation)
- [Basic Import](#basic-import)
- [Quick Examples](#quick-examples)

### Modern API (Recommended)
- [File Class](#file-class)
  - [Constructor](#file-constructor)
  - [Properties](#file-properties)
  - [Reading Methods](#file-reading-methods)
  - [Writing Methods](#file-writing-methods)
  - [File Operations](#file-operations)
  - [Static Methods](#file-static-methods)
  - [Blob Interface](#blob-interface)
- [Directory Class](#directory-class)
  - [Constructor](#directory-constructor)
  - [Properties](#directory-properties)
  - [Directory Operations](#directory-operations)
  - [Static Methods](#directory-static-methods)
- [Paths Class](#paths-class)
  - [Directory Constants](#directory-constants)
  - [Storage Properties](#storage-properties)
  - [Path Utilities](#path-utilities)
- [FileHandle Class](#filehandle-class)
- [Streams API](#streams-api)

### Types & Interfaces
- [EncodingType](#encodingtype)
- [FileCreateOptions](#filecreateoptions)
- [DirectoryCreateOptions](#directorycreateoptions)
- [FileWriteOptions](#filewriteoptions)
- [DownloadOptions](#downloadoptions-modern)
- [FileInfo](#fileinfo)
- [DirectoryInfo](#directoryinfo)
- [PathInfo](#pathinfo)
- [InfoOptions](#infooptions)

### Legacy API (Deprecated but Available)
- [Legacy Import](#legacy-import)
- [Directory Constants (Legacy)](#directory-constants-legacy)
- [Legacy Functions](#legacy-functions)
- [DownloadResumable Class](#downloadresumable-class)
- [UploadTask Class](#uploadtask-class)
- [StorageAccessFramework (Android)](#storageaccessframework-android)
- [Legacy Types](#legacy-types)

### Best Practices
- [Do's and Don'ts](#dos-and-donts)
- [Error Handling](#error-handling)
- [Platform Differences](#platform-differences)
- [Migration from Legacy API](#migration-from-legacy-api)

---

## Installation

```bash
npx expo install expo-file-system
```

For bare React Native projects:

```bash
npx expo install expo-file-system
npx expo prebuild
```

**Source:** `packages/expo-file-system/README.md`

---

## Basic Import

### Modern API (Recommended)

```typescript
import { File, Directory, Paths, EncodingType } from 'expo-file-system';
```

**Source:** `packages/expo-file-system/src/index.ts:1-14`

### Legacy API (Deprecated)

```typescript
import * as FileSystem from 'expo-file-system/legacy';
```

**Source:** `packages/expo-file-system/src/legacy/index.ts:1-2`

> **Warning:** Importing legacy methods from `expo-file-system` (without `/legacy`) will throw runtime errors with a deprecation message.

**Source:** `packages/expo-file-system/src/legacyWarnings.ts:18-22`

---

## Quick Examples

### Writing and Reading a File

```typescript
import { File, Paths } from 'expo-file-system';

// Create a file reference (file doesn't need to exist yet)
const myFile = new File(Paths.document, 'myfile.txt');

// Write content
myFile.write('Hello, World!');

// Read content
const content = await myFile.text();
console.log(content); // "Hello, World!"
```

### Creating a Directory Structure

```typescript
import { File, Directory, Paths } from 'expo-file-system';

// Create a nested directory
const dataDir = new Directory(Paths.document, 'data', 'user');
dataDir.create({ intermediates: true });

// List contents
const items = dataDir.list();
items.forEach(item => {
  if (item instanceof File) {
    console.log('File:', item.name);
  } else {
    console.log('Directory:', item.name);
  }
});
```

### Downloading a File

```typescript
import { File, Paths } from 'expo-file-system';

const downloadedFile = await File.downloadFileAsync(
  'https://example.com/image.png',
  Paths.document
);
console.log('Downloaded to:', downloadedFile.uri);
```

---

# Modern API (Recommended)

---

## File Class

The `File` class represents a file on the filesystem. It implements the `Blob` interface for web compatibility.

**Source:** `packages/expo-file-system/src/FileSystem.ts:60-144`
**Type Definitions:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:175-351`

### File Constructor

```typescript
constructor(...uris: (string | File | Directory)[])
```

Creates an instance of a file. The file does not need to exist on the filesystem during creation.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `uris` | `(string \| File \| Directory)[]` | Path segments to join. First can be a `Directory` or `File` instance. |

**Source:** `packages/expo-file-system/src/FileSystem.ts:82-85`

#### Do

```typescript
import { File, Directory, Paths } from 'expo-file-system';

// Using directory constant with path segments
const file1 = new File(Paths.document, 'data', 'config.json');

// Using file:// URI string
const file2 = new File('file:///path/to/file.txt');

// Using another file as base
const file3 = new File(file1.parentDirectory, 'other.json');

// Using a directory as base
const cacheDir = new Directory(Paths.cache, 'images');
const imageFile = new File(cacheDir, 'photo.png');
```

#### Don't

```typescript
// DON'T use relative paths without a base
const file = new File('relative/path.txt'); // Won't work properly

// DON'T use content:// URIs directly (Android)
const file = new File('content://...'); // Use File.pickFileAsync instead

// DON'T assume the file exists after creation
const file = new File(Paths.document, 'new.txt');
file.text(); // ERROR: file doesn't exist yet
```

---

### File Properties

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `uri` | `string` (readonly) | The file URI. May change after `move()`. | `ExpoFileSystem.types.ts:186` |
| `exists` | `boolean` | Whether the file exists and can be accessed. | `ExpoFileSystem.types.ts:254` |
| `size` | `number` | File size in bytes. 0 if file doesn't exist. | `ExpoFileSystem.types.ts:325` |
| `md5` | `string \| null` | MD5 hash of the file. Null if file doesn't exist. | `ExpoFileSystem.types.ts:330` |
| `modificationTime` | `number \| null` | Last modification time in milliseconds since epoch. | `ExpoFileSystem.types.ts:335` |
| `creationTime` | `number \| null` | Creation time in milliseconds since epoch. Null on Android < API 26. | `ExpoFileSystem.types.ts:340` |
| `type` | `string` | MIME type. Empty string if file doesn't exist. | `ExpoFileSystem.types.ts:345` |
| `contentUri` | `string` | Content URI for sharing (Android only). | `ExpoFileSystem.types.ts:350` |
| `name` | `string` | File name including extension. | `FileSystem.ts:105-107` |
| `extension` | `string` | File extension (e.g., `.png`). | `FileSystem.ts:98-100` |
| `parentDirectory` | `Directory` | Directory containing the file. | `FileSystem.ts:90-92` |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:175-351` and `packages/expo-file-system/src/FileSystem.ts:90-107`

#### Example: Using File Properties

```typescript
import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'photo.jpg');

// Check if file exists before operations
if (file.exists) {
  console.log('Size:', file.size, 'bytes');
  console.log('Type:', file.type); // "image/jpeg"
  console.log('Name:', file.name); // "photo.jpg"
  console.log('Extension:', file.extension); // ".jpg"
  console.log('MD5:', file.md5);
  console.log('Modified:', new Date(file.modificationTime));

  // Get parent directory
  const parentDir = file.parentDirectory;
  console.log('Parent:', parentDir.uri);
}
```

---

### File Reading Methods

#### `text(): Promise<string>`

Reads the entire file as a UTF-8 string.

**Returns:** `Promise<string>` - The file contents.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:197-198`

```typescript
const file = new File(Paths.document, 'notes.txt');
const content = await file.text();
console.log(content);
```

#### `textSync(): string`

Synchronously reads the entire file as a UTF-8 string.

**Returns:** `string` - The file contents.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:203-204`

```typescript
const file = new File(Paths.document, 'config.json');
const content = file.textSync();
const config = JSON.parse(content);
```

> **Warning:** Synchronous methods block the JavaScript thread. Use sparingly.

#### `base64(): Promise<string>`

Reads the entire file as a Base64 encoded string.

**Returns:** `Promise<string>` - The file contents as Base64.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:209-210`

```typescript
const imageFile = new File(Paths.document, 'photo.jpg');
const base64Data = await imageFile.base64();
const dataUri = `data:image/jpeg;base64,${base64Data}`;
```

#### `base64Sync(): string`

Synchronously reads the entire file as a Base64 encoded string.

**Returns:** `string` - The file contents as Base64.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:215-216`

#### `bytes(): Promise<Uint8Array>`

Reads the entire file as bytes.

**Returns:** `Promise<Uint8Array>` - The file contents as bytes.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:221-222`

```typescript
const file = new File(Paths.document, 'binary.dat');
const bytes = await file.bytes();
console.log('First byte:', bytes[0]);
```

#### `bytesSync(): Uint8Array`

Synchronously reads the entire file as bytes.

**Returns:** `Uint8Array` - The file contents as bytes.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:227-228`

---

### File Writing Methods

#### `write(content: string | Uint8Array, options?: FileWriteOptions): void`

Writes content to the file. Creates the file if it doesn't exist. Overwrites existing content.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string \| Uint8Array` | The content to write. |
| `options` | `FileWriteOptions` | Optional encoding options. |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:233-234`

#### Do

```typescript
import { File, Paths, EncodingType } from 'expo-file-system';

const file = new File(Paths.document, 'data.txt');

// Write string (default UTF-8)
file.write('Hello, World!');

// Write JSON
const data = { name: 'John', age: 30 };
file.write(JSON.stringify(data, null, 2));

// Write Base64 encoded content
file.write(base64String, { encoding: EncodingType.Base64 });

// Write binary data
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
file.write(bytes);
```

#### Don't

```typescript
// DON'T write to a file in a non-existent directory without creating it first
const file = new File(Paths.document, 'nonexistent', 'file.txt');
file.write('data'); // ERROR: directory doesn't exist

// DON'T forget to handle the encoding for binary data
const file = new File(Paths.document, 'image.png');
file.write(base64ImageData); // Wrong! Will write as plain text
file.write(base64ImageData, { encoding: EncodingType.Base64 }); // Correct

// DON'T write to bundle directory (read-only)
const bundleFile = new File(Paths.bundle, 'file.txt');
bundleFile.write('data'); // ERROR: bundle is read-only
```

---

### File Operations

#### `create(options?: FileCreateOptions): void`

Creates an empty file.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `options.intermediates` | `boolean` | Create parent directories if missing. Default: `false` |
| `options.overwrite` | `boolean` | Overwrite if file exists. Default: `false` |

**Throws:** Error if parent directory doesn't exist (unless `intermediates: true`), or file exists (unless `overwrite: true`).

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:257-261`

```typescript
const file = new File(Paths.document, 'data', 'config.json');

// Create file with parent directories
file.create({ intermediates: true });

// Create or overwrite existing file
file.create({ overwrite: true });
```

#### `delete(): void`

Deletes the file.

**Throws:** Error if file doesn't exist or cannot be deleted.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:239-241`

```typescript
const file = new File(Paths.document, 'temp.txt');
if (file.exists) {
  file.delete();
}
```

#### `copy(destination: Directory | File): void`

Copies the file to a new location.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `destination` | `Directory \| File` | Target location. If Directory, keeps original name. |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:265-266`

```typescript
const source = new File(Paths.document, 'original.txt');
const destDir = new Directory(Paths.cache);

// Copy to directory (keeps name)
source.copy(destDir);

// Copy to specific file (renames)
const destFile = new File(Paths.cache, 'copy.txt');
source.copy(destFile);
```

#### `move(destination: Directory | File): void`

Moves the file to a new location. Updates the `uri` property.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `destination` | `Directory \| File` | Target location. |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:269-271`

```typescript
const file = new File(Paths.cache, 'download.tmp');

// Move to documents
const docsDir = new Directory(Paths.document);
file.move(docsDir);

console.log(file.uri); // Now points to new location
```

#### `rename(newName: string): void`

Renames the file in the same directory.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `newName` | `string` | The new file name. |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:274-276`

```typescript
const file = new File(Paths.document, 'old-name.txt');
file.rename('new-name.txt');
console.log(file.name); // "new-name.txt"
```

#### `info(options?: InfoOptions): FileInfo`

Gets detailed information about the file.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `options.md5` | `boolean` | Include MD5 hash. Default: `false` |

**Returns:** `FileInfo` object with file metadata.

**Throws:** Error if file doesn't exist or isn't readable.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:244-248`

```typescript
const file = new File(Paths.document, 'data.json');

const info = file.info({ md5: true });
console.log(info.exists);        // true
console.log(info.size);          // 1024
console.log(info.md5);           // "d41d8cd98f00b204e9800998ecf8427e"
console.log(info.modificationTime); // 1699999999000
console.log(info.creationTime);  // 1699999990000
```

#### `open(): FileHandle`

Opens the file for random access read/write operations.

**Returns:** `FileHandle` object for low-level operations.

**Throws:** Error if file doesn't exist or cannot be opened.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:279-282`

```typescript
const file = new File(Paths.document, 'large-file.bin');
const handle = file.open();

try {
  // Read first 100 bytes
  const header = handle.readBytes(100);

  // Seek to position
  handle.offset = 1000;

  // Write at current position
  handle.writeBytes(new Uint8Array([0x00, 0x01, 0x02]));
} finally {
  handle.close(); // Always close the handle!
}
```

---

### File Static Methods

#### `File.downloadFileAsync(url, destination, options?): Promise<File>`

Downloads a file from a URL.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | The URL to download from. |
| `destination` | `Directory \| File` | Target location. |
| `options.headers` | `Record<string, string>` | HTTP headers to send. |
| `options.idempotent` | `boolean` | Overwrite existing file. Default: `false` |

**Returns:** `Promise<File>` - The downloaded file.

**Throws:** `UnableToDownload` error on non-2xx HTTP status. `DestinationAlreadyExists` if file exists (unless `idempotent: true`).

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:285-309`

```typescript
import { File, Paths } from 'expo-file-system';

// Download to directory (filename from response headers)
const file1 = await File.downloadFileAsync(
  'https://example.com/image.png',
  Paths.document
);

// Download to specific file
const targetFile = new File(Paths.document, 'my-image.png');
const file2 = await File.downloadFileAsync(
  'https://example.com/image.png',
  targetFile,
  { idempotent: true } // Overwrite if exists
);

// Download with custom headers
const file3 = await File.downloadFileAsync(
  'https://api.example.com/file',
  Paths.cache,
  {
    headers: {
      'Authorization': 'Bearer token123',
      'Accept': 'application/octet-stream'
    }
  }
);
```

> **Platform Behavior:**
> - **Android:** Response body streams directly into the file. If download fails after starting, a partially written file may remain.
> - **iOS:** Download completes in a temporary location first, then moves to destination only after success. No partial files are left on failure.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:287-291`

#### `File.pickFileAsync(initialUri?, mimeType?): Promise<File | File[]>`

Opens the system file picker to select a file.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `initialUri` | `string` (optional) | Initial folder URI. |
| `mimeType` | `string` (optional) | MIME type filter (e.g., `image/*`). |

**Returns:** `Promise<File | File[]>` - Selected file(s).

**Note:** On iOS, returns a temporary copy of the file, leaving the original untouched.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:312-320`

```typescript
import { File } from 'expo-file-system';

// Pick any file
const file = await File.pickFileAsync();
console.log('Selected:', file.uri);

// Pick only images
const imageFile = await File.pickFileAsync(undefined, 'image/*');

// Pick PDFs
const pdfFile = await File.pickFileAsync(undefined, 'application/pdf');
```

---

### Blob Interface

The `File` class implements the standard `Blob` interface for web API compatibility.

**Source:** `packages/expo-file-system/src/FileSystem.ts:71`

#### `arrayBuffer(): Promise<ArrayBuffer>`

Returns the file contents as an ArrayBuffer.

**Source:** `packages/expo-file-system/src/FileSystem.ts:117-120`

```typescript
const file = new File(Paths.document, 'data.bin');
const buffer = await file.arrayBuffer();
const view = new DataView(buffer);
```

#### `stream(): ReadableStream<Uint8Array>`

Returns a readable stream for the file.

**Source:** `packages/expo-file-system/src/FileSystem.ts:122-124`

```typescript
const file = new File(Paths.document, 'large-file.dat');
const reader = file.stream().getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Chunk:', value.length, 'bytes');
}
```

#### `slice(start?, end?, contentType?): Blob`

Returns a portion of the file as a Blob.

**Source:** `packages/expo-file-system/src/FileSystem.ts:126-128`

```typescript
const file = new File(Paths.document, 'video.mp4');
const firstMB = file.slice(0, 1024 * 1024, 'video/mp4');
```

#### `readableStream(): ReadableStream`

Returns a readable byte stream.

**Source:** `packages/expo-file-system/src/FileSystem.ts:109-111`

#### `writableStream(): WritableStream<Uint8Array>`

Returns a writable stream for the file.

**Source:** `packages/expo-file-system/src/FileSystem.ts:113-115`

```typescript
const file = new File(Paths.document, 'output.dat');
const writer = file.writableStream().getWriter();

await writer.write(new Uint8Array([1, 2, 3]));
await writer.write(new Uint8Array([4, 5, 6]));
await writer.close();
```

---

## Directory Class

The `Directory` class represents a directory on the filesystem.

**Source:** `packages/expo-file-system/src/FileSystem.ts:146-212`
**Type Definitions:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:56-151`

### Directory Constructor

```typescript
constructor(...uris: (string | File | Directory)[])
```

Creates an instance of a directory. The directory does not need to exist.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `uris` | `(string \| File \| Directory)[]` | Path segments to join. |

**Source:** `packages/expo-file-system/src/FileSystem.ts:168-171`

```typescript
import { Directory, Paths } from 'expo-file-system';

// Using Paths constant
const dataDir = new Directory(Paths.document, 'data');

// Nested path
const userDir = new Directory(Paths.document, 'data', 'users', 'john');

// From file:// URI
const dir = new Directory('file:///path/to/directory');
```

---

### Directory Properties

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `uri` | `string` (readonly) | The directory URI. May change after `move()`. | `ExpoFileSystem.types.ts:70` |
| `exists` | `boolean` | Whether the directory exists and is accessible. | `ExpoFileSystem.types.ts:88` |
| `size` | `number \| null` | Directory size in bytes. Null if doesn't exist. | `ExpoFileSystem.types.ts:140` |
| `name` | `string` | Directory name. | `FileSystem.ts:195-197` |
| `parentDirectory` | `Directory` | Parent directory. | `FileSystem.ts:176-178` |

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:56-151` and `packages/expo-file-system/src/FileSystem.ts:176-197`

```typescript
const dir = new Directory(Paths.document, 'myapp');

if (dir.exists) {
  console.log('Name:', dir.name);
  console.log('Size:', dir.size, 'bytes');
  console.log('Parent:', dir.parentDirectory.uri);
}
```

---

### Directory Operations

#### `create(options?: DirectoryCreateOptions): void`

Creates the directory.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `options.intermediates` | `boolean` | Create parent directories. Default: `false` |
| `options.overwrite` | `boolean` | Overwrite if exists. Default: `false` |
| `options.idempotent` | `boolean` | Don't error if exists. Default: `false` |

**Throws:** Error if parent doesn't exist (unless `intermediates: true`) or directory exists (unless `idempotent: true`).

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:91-95`

```typescript
const dir = new Directory(Paths.document, 'data', 'cache', 'images');

// Create all intermediate directories
dir.create({ intermediates: true });

// Create idempotently (no error if exists)
dir.create({ idempotent: true });

// Both options
dir.create({ intermediates: true, idempotent: true });
```

#### `delete(): void`

Deletes the directory and all its contents recursively.

**Throws:** Error if directory doesn't exist or cannot be deleted.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:79-83`

```typescript
const cacheDir = new Directory(Paths.cache, 'temp');
if (cacheDir.exists) {
  cacheDir.delete(); // Deletes everything inside too
}
```

#### `list(): (Directory | File)[]`

Lists all files and directories in this directory.

**Returns:** Array of `Directory` and `File` instances.

**Throws:** Error if directory doesn't exist.

**Source:** `packages/expo-file-system/src/FileSystem.ts:185-190`

```typescript
const dir = new Directory(Paths.document);
const items = dir.list();

for (const item of items) {
  if (item instanceof File) {
    console.log(`File: ${item.name} (${item.size} bytes)`);
  } else if (item instanceof Directory) {
    console.log(`Dir: ${item.name}/`);
  }
}
```

#### `copy(destination: Directory | File): void`

Copies the directory and all contents to a new location.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:101-104`

#### `move(destination: Directory | File): void`

Moves the directory to a new location. Updates the `uri` property.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:106-109`

#### `rename(newName: string): void`

Renames the directory in place.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:111-114`

#### `info(): DirectoryInfo`

Gets detailed information about the directory.

**Returns:** `DirectoryInfo` object with metadata.

**Throws:** Error if path doesn't point to a directory.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:129-135`

```typescript
const dir = new Directory(Paths.document);
const info = dir.info();

console.log('Exists:', info.exists);
console.log('Size:', info.size);
console.log('Files:', info.files); // Array of file names
console.log('Modified:', info.modificationTime);
```

#### `createFile(name: string, mimeType: string | null): File`

Creates a new file in this directory.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | The file name. |
| `mimeType` | `string \| null` | MIME type or null. |

**Returns:** The created `File` instance.

**Source:** `packages/expo-file-system/src/FileSystem.ts:199-202`

```typescript
const dir = new Directory(Paths.document, 'data');
dir.create({ idempotent: true });

const jsonFile = dir.createFile('config.json', 'application/json');
jsonFile.write('{}');
```

#### `createDirectory(name: string): Directory`

Creates a new subdirectory.

**Returns:** The created `Directory` instance.

**Source:** `packages/expo-file-system/src/FileSystem.ts:204-206`

---

### Directory Static Methods

#### `Directory.pickDirectoryAsync(initialUri?): Promise<Directory>`

Opens the system directory picker.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `initialUri` | `string` (optional) | Initial folder URI. |

**Returns:** `Promise<Directory>` - Selected directory.

**Platform Notes:**
- **iOS:** Selected directory grants temporary read/write access for the current app session only. After app restart, you must prompt again.
- **Android:** Returns a content URI.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:143-150`

```typescript
import { Directory } from 'expo-file-system';

const selectedDir = await Directory.pickDirectoryAsync();
console.log('Selected:', selectedDir.uri);

// List contents of selected directory
const contents = selectedDir.list();
```

---

## Paths Class

The `Paths` class provides directory constants and path manipulation utilities.

**Source:** `packages/expo-file-system/src/FileSystem.ts:6-58`

### Directory Constants

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `Paths.document` | `Directory` | Safe storage for user documents. Persists until explicitly deleted. | `FileSystem.ts:24-26` |
| `Paths.cache` | `Directory` | Temporary storage. System may delete when low on storage. | `FileSystem.ts:10-12` |
| `Paths.bundle` | `Directory` | Read-only directory with bundled app assets. | `FileSystem.ts:17-19` |
| `Paths.appleSharedContainers` | `Record<string, Directory>` | iOS App Group containers (iOS only). | `FileSystem.ts:27-36` |

```typescript
import { Paths, File, Directory } from 'expo-file-system';

// Document directory - safe for user data
const userFile = new File(Paths.document, 'user-data.json');

// Cache directory - for temporary data
const cacheFile = new File(Paths.cache, 'temp.dat');

// Bundle directory - read-only app assets
const assetDir = new Directory(Paths.bundle, 'assets');

// iOS App Groups (for sharing data between extensions)
const sharedContainer = Paths.appleSharedContainers['group.com.myapp'];
if (sharedContainer) {
  const sharedFile = new File(sharedContainer, 'shared.json');
}
```

---

### Storage Properties

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `Paths.totalDiskSpace` | `number` | Total device storage in bytes. | `FileSystem.ts:41-43` |
| `Paths.availableDiskSpace` | `number` | Available device storage in bytes. | `FileSystem.ts:48-50` |

```typescript
import { Paths } from 'expo-file-system';

const total = Paths.totalDiskSpace;
const available = Paths.availableDiskSpace;
const used = total - available;

console.log(`Storage: ${(used / 1e9).toFixed(2)} GB used of ${(total / 1e9).toFixed(2)} GB`);
console.log(`Available: ${(available / 1e9).toFixed(2)} GB`);
```

---

### Path Utilities

All path utilities are static methods on the `Paths` class.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts`

#### `Paths.join(...paths): string`

Joins path segments into a single path.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:15-23`

```typescript
const path = Paths.join(Paths.document.uri, 'data', 'users', 'profile.json');
// "file:///path/to/documents/data/users/profile.json"
```

#### `Paths.relative(from, to): string`

Gets the relative path from one location to another.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:31-44`

```typescript
const from = new File(Paths.document, 'dir1', 'file.txt');
const to = new File(Paths.document, 'dir2', 'file.txt');
const relative = Paths.relative(from, to);
// "../dir2/file.txt"
```

#### `Paths.isAbsolute(path): boolean`

Checks if a path is absolute.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:51-57`

```typescript
Paths.isAbsolute('file:///path/to/file'); // true
Paths.isAbsolute('/absolute/path');       // true
Paths.isAbsolute('relative/path');        // false
```

#### `Paths.normalize(path): string`

Normalizes a path, resolving `..` and `.` segments.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:64-72`

```typescript
Paths.normalize('file:///path/./to/../file.txt');
// "file:///path/file.txt"
```

#### `Paths.dirname(path): string`

Returns the directory name of a path.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:79-87`

```typescript
const dir = Paths.dirname('file:///path/to/file.txt');
// "file:///path/to"
```

#### `Paths.basename(path, ext?): string`

Returns the last portion of a path (file name).

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:95-102`

```typescript
Paths.basename('file:///path/to/file.txt');      // "file.txt"
Paths.basename('file:///path/to/file.txt', '.txt'); // "file"
```

#### `Paths.extname(path): string`

Returns the file extension.

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:109-116`

```typescript
Paths.extname('file:///path/to/file.txt');   // ".txt"
Paths.extname('file:///path/to/file.tar.gz'); // ".gz"
```

#### `Paths.parse(path): object`

Parses a path into its components.

**Returns:** `{ root: string; dir: string; base: string; ext: string; name: string }`

**Source:** `packages/expo-file-system/src/pathUtilities/index.ts:123-136`

```typescript
const parsed = Paths.parse('file:///path/to/file.txt');
// {
//   root: '/',
//   dir: '/path/to',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }
```

#### `Paths.info(...uris): PathInfo`

Returns information about whether a path exists and if it's a directory.

**Source:** `packages/expo-file-system/src/FileSystem.ts:55-57`

```typescript
const info = Paths.info('file:///path/to/something');
if (info.exists) {
  if (info.isDirectory) {
    console.log('It is a directory');
  } else {
    console.log('It is a file');
  }
}
```

---

## FileHandle Class

The `FileHandle` class provides low-level random access to files for efficient reading and writing at specific offsets.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:353-378`

### Properties

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `offset` | `number \| null` | Current byte offset. Null if handle is closed. | `ExpoFileSystem.types.ts:373` |
| `size` | `number \| null` | File size in bytes. Null if handle is closed. | `ExpoFileSystem.types.ts:377` |

### Methods

#### `readBytes(length: number): Uint8Array`

Reads bytes from the current offset position.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:362`

#### `writeBytes(bytes: Uint8Array): void`

Writes bytes at the current offset position.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:367`

#### `close(): void`

Closes the file handle. Always call this when done to release the file.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:357`

### Complete Example

```typescript
import { File, Paths } from 'expo-file-system';

// Create a file with some content
const file = new File(Paths.document, 'data.bin');
file.write(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

// Open for random access
const handle = file.open();

try {
  console.log('File size:', handle.size); // 10
  console.log('Current offset:', handle.offset); // 0

  // Read first 4 bytes
  const header = handle.readBytes(4);
  console.log('Header:', header); // Uint8Array [0, 1, 2, 3]
  console.log('Offset after read:', handle.offset); // 4

  // Seek to position 6
  handle.offset = 6;

  // Read 2 bytes from position 6
  const data = handle.readBytes(2);
  console.log('Data:', data); // Uint8Array [6, 7]

  // Write at current position (8)
  handle.writeBytes(new Uint8Array([100, 101]));

  // Verify the write
  handle.offset = 0;
  const all = handle.readBytes(10);
  console.log('All data:', all); // [0,1,2,3,4,5,6,7,100,101]

} finally {
  // ALWAYS close the handle
  handle.close();
}
```

---

## Streams API

The Streams API provides web-standard streaming interfaces for efficient file I/O.

**Source:** `packages/expo-file-system/src/streams.ts`

### FileSystemReadableStreamSource

Implements `UnderlyingByteSource` for creating readable streams from files.

**Source:** `packages/expo-file-system/src/streams.ts:3-45`

```typescript
import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'large-file.dat');
const stream = file.readableStream();
const reader = stream.getReader();

let totalBytes = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  totalBytes += value.length;
  // Process chunk...
}
console.log('Total bytes read:', totalBytes);
```

### FileSystemWritableSink

Implements `UnderlyingSink` for creating writable streams to files.

**Source:** `packages/expo-file-system/src/streams.ts:47-65`

```typescript
import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'output.bin');
const stream = file.writableStream();
const writer = stream.getWriter();

// Write chunks
await writer.write(new Uint8Array([1, 2, 3, 4]));
await writer.write(new Uint8Array([5, 6, 7, 8]));

// Close when done
await writer.close();
```

### Streaming File Copy Example

```typescript
import { File, Paths } from 'expo-file-system';

async function copyFileWithProgress(source: File, dest: File) {
  const reader = source.readableStream().getReader();
  const writer = dest.writableStream().getWriter();

  let bytesCopied = 0;
  const totalSize = source.size;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await writer.write(value);
      bytesCopied += value.length;

      const progress = (bytesCopied / totalSize * 100).toFixed(1);
      console.log(`Progress: ${progress}%`);
    }
  } finally {
    await writer.close();
  }
}
```

---

# Types & Interfaces

---

## EncodingType

Enum defining file encoding types.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:14-23`

```typescript
enum EncodingType {
  /**
   * Standard UTF-8 encoding.
   */
  UTF8 = 'utf8',

  /**
   * Binary, radix-64 (Base64) representation.
   */
  Base64 = 'base64',
}
```

---

## FileCreateOptions

Options for creating a file.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:1-12`

```typescript
type FileCreateOptions = {
  /**
   * Whether to create intermediate directories if they do not exist.
   * @default false
   */
  intermediates?: boolean;

  /**
   * Whether to overwrite the file if it exists.
   * @default false
   */
  overwrite?: boolean;
};
```

---

## DirectoryCreateOptions

Options for creating a directory.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:33-54`

```typescript
type DirectoryCreateOptions = {
  /**
   * Whether to create intermediate directories if they do not exist.
   * @default false
   */
  intermediates?: boolean;

  /**
   * Whether to overwrite the directory if it exists.
   * @default false
   */
  overwrite?: boolean;

  /**
   * If true, creating a directory that already exists will succeed silently.
   * If false, an error will be thrown when the target already exists.
   * @default false
   */
  idempotent?: boolean;
};
```

---

## FileWriteOptions

Options for writing to a file.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:25-31`

```typescript
type FileWriteOptions = {
  /**
   * The encoding format to use when writing the file.
   * @default EncodingType.UTF8
   */
  encoding?: EncodingType | 'utf8' | 'base64';
};
```

---

## DownloadOptions (Modern)

Options for downloading files (modern API).

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:153-170`

```typescript
type DownloadOptions = {
  /**
   * HTTP headers to send with the request.
   */
  headers?: {
    [key: string]: string;
  };

  /**
   * If true, downloading to an existing file overwrites it.
   * If false, an error is thrown when the target file exists.
   * @default false
   */
  idempotent?: boolean;
};
```

---

## FileInfo

Information about a file returned by `info()`.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:380-405`

```typescript
type FileInfo = {
  exists: boolean;
  uri?: string;
  size?: number;
  modificationTime?: number;
  creationTime?: number;
  md5?: string;
};
```

---

## DirectoryInfo

Information about a directory returned by `info()`.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:427-452`

```typescript
type DirectoryInfo = {
  exists: boolean;
  uri?: string;
  size?: number;
  modificationTime?: number;
  creationTime?: number;
  files?: string[];
};
```

---

## PathInfo

Information about a path returned by `Paths.info()`.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:416-425`

```typescript
type PathInfo = {
  exists: boolean;
  isDirectory: boolean | null;
};
```

---

## InfoOptions

Options for retrieving file/directory info.

**Source:** `packages/expo-file-system/src/ExpoFileSystem.types.ts:407-414`

```typescript
type InfoOptions = {
  /**
   * Whether to return the MD5 hash of the file.
   * @default false
   */
  md5?: boolean;
};
```

---

# Legacy API (Deprecated but Available)

The legacy API is deprecated but still available for features not yet ported to the modern API (like resumable downloads and uploads).

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts`
**Type Definitions:** `packages/expo-file-system/src/legacy/FileSystem.types.ts`

---

## Legacy Import

```typescript
import * as FileSystem from 'expo-file-system/legacy';

// Or import specific items
import {
  documentDirectory,
  cacheDirectory,
  downloadAsync,
  readAsStringAsync,
  createDownloadResumable,
  DownloadResumable,
  StorageAccessFramework,
} from 'expo-file-system/legacy';
```

**Source:** `packages/expo-file-system/src/legacy/index.ts:1-2`

---

## Directory Constants (Legacy)

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:46-58`

```typescript
// file:// URI to document directory (ends with /)
const documentDirectory: string | null;

// file:// URI to cache directory (ends with /)
const cacheDirectory: string | null;

// URI to bundle directory (ends with /)
const bundleDirectory: string | null;
```

### Usage

```typescript
import * as FileSystem from 'expo-file-system/legacy';

const filePath = FileSystem.documentDirectory + 'myfile.txt';
const cachePath = FileSystem.cacheDirectory + 'temp.dat';
```

---

## Legacy Functions

### getInfoAsync

Gets metadata about a file or directory.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:67-72`

```typescript
async function getInfoAsync(
  fileUri: string,
  options?: InfoOptions
): Promise<FileInfo>
```

```typescript
import * as FileSystem from 'expo-file-system/legacy';

const info = await FileSystem.getInfoAsync(
  FileSystem.documentDirectory + 'file.txt',
  { md5: true }
);

if (info.exists) {
  console.log('Size:', info.size);
  console.log('Is directory:', info.isDirectory);
  console.log('MD5:', info.md5);
}
```

### readAsStringAsync

Reads a file as a string.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:80-88`

```typescript
async function readAsStringAsync(
  fileUri: string,
  options?: ReadingOptions
): Promise<string>
```

```typescript
import * as FileSystem from 'expo-file-system/legacy';

// Read as UTF-8 (default)
const text = await FileSystem.readAsStringAsync(
  FileSystem.documentDirectory + 'notes.txt'
);

// Read as Base64
const base64 = await FileSystem.readAsStringAsync(
  FileSystem.documentDirectory + 'image.png',
  { encoding: FileSystem.EncodingType.Base64 }
);

// Read portion of file
const portion = await FileSystem.readAsStringAsync(
  FileSystem.documentDirectory + 'large.bin',
  {
    encoding: FileSystem.EncodingType.Base64,
    position: 1000,  // Start at byte 1000
    length: 500      // Read 500 bytes
  }
);
```

### writeAsStringAsync

Writes content to a file.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:125-134`

```typescript
async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: WritingOptions
): Promise<void>
```

### deleteAsync

Deletes a file or directory.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:141-146`

```typescript
async function deleteAsync(
  fileUri: string,
  options?: DeletingOptions
): Promise<void>
```

### moveAsync / copyAsync

Move or copy files/directories.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:160-177`

```typescript
async function moveAsync(options: RelocatingOptions): Promise<void>
async function copyAsync(options: RelocatingOptions): Promise<void>
```

```typescript
import * as FileSystem from 'expo-file-system/legacy';

await FileSystem.moveAsync({
  from: FileSystem.cacheDirectory + 'download.tmp',
  to: FileSystem.documentDirectory + 'file.pdf'
});

await FileSystem.copyAsync({
  from: FileSystem.documentDirectory + 'original.txt',
  to: FileSystem.documentDirectory + 'backup/copy.txt'
});
```

### makeDirectoryAsync

Creates a directory.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:184-192`

```typescript
async function makeDirectoryAsync(
  fileUri: string,
  options?: MakeDirectoryOptions
): Promise<void>
```

### readDirectoryAsync

Lists directory contents.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:199-204`

```typescript
async function readDirectoryAsync(fileUri: string): Promise<string[]>
```

### downloadAsync

Downloads a file from a URL.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:249-262`

```typescript
async function downloadAsync(
  uri: string,
  fileUri: string,
  options?: DownloadOptions
): Promise<FileSystemDownloadResult>
```

```typescript
import * as FileSystem from 'expo-file-system/legacy';

const result = await FileSystem.downloadAsync(
  'https://example.com/file.pdf',
  FileSystem.documentDirectory + 'file.pdf',
  {
    headers: { 'Authorization': 'Bearer token' },
    md5: true  // Include MD5 hash in result
  }
);

console.log('Downloaded to:', result.uri);
console.log('HTTP Status:', result.status);
console.log('MD5:', result.md5);
```

### uploadAsync

Uploads a file to a URL.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:292-307`

```typescript
async function uploadAsync(
  url: string,
  fileUri: string,
  options?: FileSystemUploadOptions
): Promise<FileSystemUploadResult>
```

```typescript
import * as FileSystem from 'expo-file-system/legacy';

// Binary upload
const result = await FileSystem.uploadAsync(
  'https://api.example.com/upload',
  FileSystem.documentDirectory + 'file.pdf',
  {
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    httpMethod: 'PUT',
    headers: { 'Content-Type': 'application/pdf' }
  }
);

// Multipart form upload
const multipartResult = await FileSystem.uploadAsync(
  'https://api.example.com/upload',
  FileSystem.documentDirectory + 'image.jpg',
  {
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'photo',
    mimeType: 'image/jpeg',
    parameters: { description: 'My photo' }
  }
);
```

### getFreeDiskStorageAsync / getTotalDiskCapacityAsync

Get disk storage information.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:210-226`

```typescript
async function getFreeDiskStorageAsync(): Promise<number>
async function getTotalDiskCapacityAsync(): Promise<number>
```

### getContentUriAsync (Android)

Converts a file:// URI to a content:// URI for sharing with other apps.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:107-116`

```typescript
async function getContentUriAsync(fileUri: string): Promise<string>
```

---

## DownloadResumable Class

A class for creating resumable downloads with progress tracking.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:458-567`

### Creating a DownloadResumable

```typescript
function createDownloadResumable(
  uri: string,
  fileUri: string,
  options?: DownloadOptions,
  callback?: (data: DownloadProgressData) => void,
  resumeData?: string
): DownloadResumable
```

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:325-333`

### Methods

| Method | Description | Source |
|--------|-------------|--------|
| `downloadAsync()` | Starts or resumes the download. | `FileSystem.ts:485-502` |
| `pauseAsync()` | Pauses the download. | `FileSystem.ts:509-530` |
| `resumeAsync()` | Resumes a paused download. | `FileSystem.ts:536-553` |
| `cancelAsync()` | Cancels the download. | `FileSystem.ts:352-360` |
| `savable()` | Returns state for AsyncStorage. | `FileSystem.ts:559-566` |

### Complete Example

```typescript
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a resumable download
const downloadResumable = FileSystem.createDownloadResumable(
  'https://example.com/large-file.zip',
  FileSystem.documentDirectory + 'large-file.zip',
  { md5: true },
  (progress) => {
    const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
    console.log(`Progress: ${(percent * 100).toFixed(1)}%`);
  }
);

// Start download
try {
  const result = await downloadResumable.downloadAsync();
  console.log('Download complete:', result.uri);
} catch (e) {
  console.error('Download failed:', e);
}

// Pause download
const pauseState = await downloadResumable.pauseAsync();

// Save state for later
await AsyncStorage.setItem('download', JSON.stringify(pauseState));

// Later: Resume download
const savedState = JSON.parse(await AsyncStorage.getItem('download'));
const resumedDownload = FileSystem.createDownloadResumable(
  savedState.url,
  savedState.fileUri,
  savedState.options,
  (progress) => console.log('Progress:', progress),
  savedState.resumeData
);
const result = await resumedDownload.resumeAsync();
```

---

## UploadTask Class

A class for creating upload tasks with progress tracking.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:406-456`

### Creating an UploadTask

```typescript
function createUploadTask(
  url: string,
  fileUri: string,
  options?: FileSystemUploadOptions,
  callback?: (data: UploadProgressData) => void
): UploadTask
```

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:335-342`

### Example

```typescript
import * as FileSystem from 'expo-file-system/legacy';

const uploadTask = FileSystem.createUploadTask(
  'https://api.example.com/upload',
  FileSystem.documentDirectory + 'video.mp4',
  {
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    httpMethod: 'POST',
    headers: { 'Content-Type': 'video/mp4' }
  },
  (progress) => {
    const percent = progress.totalBytesSent / progress.totalBytesExpectedToSend;
    console.log(`Upload progress: ${(percent * 100).toFixed(1)}%`);
  }
);

try {
  const result = await uploadTask.uploadAsync();
  console.log('Upload complete, response:', result.body);
} catch (e) {
  console.error('Upload failed:', e);
}

// Cancel if needed
// await uploadTask.cancelAsync();
```

---

## StorageAccessFramework (Android)

The Storage Access Framework (SAF) provides access to documents and files that the user has explicitly granted access to.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:656-760`

### Functions

#### requestDirectoryPermissionsAsync

Prompts the user to select a directory and grant access.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:675-686`

```typescript
async function requestDirectoryPermissionsAsync(
  initialFileUrl?: string | null
): Promise<FileSystemRequestDirectoryPermissionsResult>
```

```typescript
import { StorageAccessFramework } from 'expo-file-system/legacy';

const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

if (permissions.granted) {
  const uri = permissions.directoryUri;
  console.log('Granted access to:', uri);

  // Read directory contents
  const files = await StorageAccessFramework.readDirectoryAsync(uri);
  console.log('Files:', files);
}
```

#### getUriForDirectoryInRoot

Gets a SAF URI for a folder in the Android root directory.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:664-666`

```typescript
function getUriForDirectoryInRoot(folderName: string): string
```

#### readDirectoryAsync / makeDirectoryAsync / createFileAsync

SAF-specific directory and file operations.

**Source:** `packages/expo-file-system/src/legacy/FileSystem.ts:694-738`

```typescript
async function readDirectoryAsync(dirUri: string): Promise<string[]>
async function makeDirectoryAsync(parentUri: string, dirName: string): Promise<string>
async function createFileAsync(parentUri: string, fileName: string, mimeType: string): Promise<string>
```

### Complete SAF Example

```typescript
import { StorageAccessFramework } from 'expo-file-system/legacy';

async function saveToExternalStorage(content: string, fileName: string) {
  // Request directory access
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted) {
    console.log('Permission denied');
    return;
  }

  const dirUri = permissions.directoryUri;

  // Create the file
  const fileUri = await StorageAccessFramework.createFileAsync(
    dirUri,
    fileName,
    'text/plain'
  );

  // Write to the file
  await StorageAccessFramework.writeAsStringAsync(fileUri, content);

  console.log('Saved to:', fileUri);
}
```

---

## Legacy Types

### FileSystemSessionType

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:5-17`

```typescript
enum FileSystemSessionType {
  BACKGROUND = 0,  // Continues in background
  FOREGROUND = 1,  // Terminates when app backgrounds
}
```

### FileSystemUploadType

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:19-29`

```typescript
enum FileSystemUploadType {
  BINARY_CONTENT = 0,  // Raw binary body
  MULTIPART = 1,       // RFC 2387 multipart form
}
```

### ReadingOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:249-263`

```typescript
type ReadingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
  position?: number;  // Only with Base64 + length
  length?: number;    // Only with Base64 + position
};
```

### WritingOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:265-271`

```typescript
type WritingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
};
```

### DeletingOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:273-279`

```typescript
type DeletingOptions = {
  idempotent?: boolean;  // Don't throw if file doesn't exist
};
```

### RelocatingOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:289-298`

```typescript
type RelocatingOptions = {
  from: string;  // Source URI
  to: string;    // Destination URI
};
```

### MakeDirectoryOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:300-306`

```typescript
type MakeDirectoryOptions = {
  intermediates?: boolean;  // Create parent directories
};
```

### DownloadOptions (Legacy)

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:31-49`

```typescript
type DownloadOptions = {
  md5?: boolean;                    // Include MD5 in result
  cache?: boolean;
  headers?: Record<string, string>;
  sessionType?: FileSystemSessionType;  // iOS only
};
```

### DownloadProgressData

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:151-161`

```typescript
type DownloadProgressData = {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;  // -1 if unknown
};
```

### UploadProgressData

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:163-172`

```typescript
type UploadProgressData = {
  totalBytesSent: number;
  totalBytesExpectedToSend: number;
};
```

### FileSystemDownloadResult

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:65-74`

```typescript
type FileSystemDownloadResult = {
  uri: string;
  status: number;
  headers: Record<string, string>;
  mimeType: string | null;
  md5?: string;
};
```

### FileSystemUploadResult

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:134-139`

```typescript
type FileSystemUploadResult = {
  body: string;
  status: number;
  headers: Record<string, string>;
  mimeType: string | null;
};
```

### FileSystemUploadOptions

**Source:** `packages/expo-file-system/src/legacy/FileSystem.types.ts:81-98`

```typescript
type FileSystemUploadOptions = {
  headers?: Record<string, string>;
  httpMethod?: 'POST' | 'PUT' | 'PATCH';
  sessionType?: FileSystemSessionType;
  uploadType?: FileSystemUploadType;
  // For MULTIPART:
  fieldName?: string;
  mimeType?: string;
  parameters?: Record<string, string>;
};
```

---

# Best Practices

## Do's and Don'ts

### File Operations

#### Do

```typescript
import { File, Directory, Paths } from 'expo-file-system';

// Always check if file exists before reading
const file = new File(Paths.document, 'config.json');
if (file.exists) {
  const content = await file.text();
}

// Create parent directories when writing to nested paths
const nestedFile = new File(Paths.document, 'data', 'users', 'profile.json');
nestedFile.parentDirectory.create({ intermediates: true, idempotent: true });
nestedFile.write(JSON.stringify(userData));

// Use cache directory for temporary files
const tempFile = new File(Paths.cache, 'temp-download.tmp');

// Use document directory for user data that should persist
const userFile = new File(Paths.document, 'user-preferences.json');

// Always close file handles
const handle = file.open();
try {
  // ... operations
} finally {
  handle.close();
}

// Use idempotent operations for robustness
dir.create({ intermediates: true, idempotent: true });
```

#### Don't

```typescript
// DON'T write to bundle directory (read-only)
const bundleFile = new File(Paths.bundle, 'new-file.txt');
bundleFile.write('data'); // ERROR!

// DON'T assume directories exist
const file = new File(Paths.document, 'missing', 'dir', 'file.txt');
file.write('data'); // ERROR if directories don't exist

// DON'T forget to handle non-existent files
const file = new File(Paths.document, 'maybe-exists.txt');
const text = await file.text(); // ERROR if file doesn't exist

// DON'T use relative paths
const file = new File('relative/path.txt'); // Won't work correctly

// DON'T leave file handles open
const handle = file.open();
handle.readBytes(100);
// Missing handle.close() - file stays locked!

// DON'T use legacy API from main import
import { readAsStringAsync } from 'expo-file-system';
await readAsStringAsync(uri); // THROWS at runtime!
```

### Downloading Files

#### Do

```typescript
import { File, Paths } from 'expo-file-system';

// Handle download errors
try {
  const file = await File.downloadFileAsync(
    'https://example.com/file.zip',
    Paths.document
  );
  console.log('Downloaded:', file.uri);
} catch (error) {
  if (error.message.includes('DestinationAlreadyExists')) {
    console.log('File already exists');
  } else if (error.message.includes('UnableToDownload')) {
    console.log('Download failed:', error.message);
  }
}

// Use idempotent for overwriting
const file = await File.downloadFileAsync(
  url,
  new File(Paths.document, 'data.json'),
  { idempotent: true }
);

// Download to cache for temporary files
const cached = await File.downloadFileAsync(
  imageUrl,
  Paths.cache
);
```

### Memory and Performance

#### Do

```typescript
// Use streams for large files
const file = new File(Paths.document, 'large-video.mp4');
const reader = file.readableStream().getReader();

let chunk;
while (!(chunk = await reader.read()).done) {
  processChunk(chunk.value);
}

// Use FileHandle for random access
const handle = file.open();
handle.offset = 1000000; // Seek to 1MB
const data = handle.readBytes(1024); // Read 1KB
handle.close();

// Check available space before large writes
if (Paths.availableDiskSpace > requiredSpace) {
  // Safe to proceed
}
```

#### Don't

```typescript
// DON'T load entire large files into memory
const hugeFile = new File(Paths.document, 'huge-video.mp4');
const allBytes = await hugeFile.bytes(); // Memory issues!

// DON'T use sync methods for large files (blocks UI)
const data = hugeFile.textSync(); // UI freezes!
```

---

## Error Handling

```typescript
import { File, Directory, Paths } from 'expo-file-system';

// Comprehensive error handling
async function safeFileOperation() {
  const file = new File(Paths.document, 'data.json');

  try {
    if (!file.exists) {
      console.log('File does not exist');
      return null;
    }

    const content = await file.text();
    return JSON.parse(content);

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Invalid JSON in file');
    } else {
      console.error('File operation failed:', error.message);
    }
    return null;
  }
}

// Download with comprehensive error handling
async function downloadWithRetry(url: string, maxRetries = 3) {
  const destination = new File(Paths.cache, 'download.tmp');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await File.downloadFileAsync(url, destination, { idempotent: true });
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}
```

---

## Platform Differences

### iOS vs Android Differences

| Feature | iOS | Android |
|---------|-----|---------|
| `File.contentUri` | Returns same as `uri` | Returns content:// URI |
| `creationTime` | Always available | Null on API < 26 |
| `File.pickFileAsync` | Returns temporary copy | Returns original file |
| `Directory.pickDirectoryAsync` | Session-only access | Persistent access |
| Download failure | No partial file left | May leave partial file |
| Session types | Affects background behavior | Always background |

### iOS-Specific Features

```typescript
import { Paths } from 'expo-file-system';

// Access App Group containers (iOS only)
const sharedContainers = Paths.appleSharedContainers;

if (sharedContainers['group.com.myapp']) {
  const sharedDir = sharedContainers['group.com.myapp'];
  const sharedFile = new File(sharedDir, 'shared-data.json');
  // Share data between main app and extensions
}
```

### Android-Specific Features

```typescript
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';

// Get content URI for sharing (Android)
const file = new File(Paths.document, 'share-me.pdf');
const contentUri = file.contentUri;

// Use Storage Access Framework for external storage
const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
if (permissions.granted) {
  // Access external storage
}
```

---

## Migration from Legacy API

### Quick Reference

| Legacy API | Modern API |
|------------|------------|
| `documentDirectory` | `Paths.document` |
| `cacheDirectory` | `Paths.cache` |
| `bundleDirectory` | `Paths.bundle` |
| `getInfoAsync(uri)` | `new File(uri).info()` |
| `readAsStringAsync(uri)` | `new File(uri).text()` |
| `writeAsStringAsync(uri, content)` | `new File(uri).write(content)` |
| `deleteAsync(uri)` | `new File(uri).delete()` |
| `moveAsync({from, to})` | `new File(from).move(new File(to))` |
| `copyAsync({from, to})` | `new File(from).copy(new File(to))` |
| `makeDirectoryAsync(uri)` | `new Directory(uri).create()` |
| `readDirectoryAsync(uri)` | `new Directory(uri).list()` |
| `downloadAsync(url, uri)` | `File.downloadFileAsync(url, destination)` |
| `getFreeDiskStorageAsync()` | `Paths.availableDiskSpace` |
| `getTotalDiskCapacityAsync()` | `Paths.totalDiskSpace` |

### Migration Example

#### Before (Legacy)

```typescript
import * as FileSystem from 'expo-file-system/legacy';

async function saveUserData(data: object) {
  const uri = FileSystem.documentDirectory + 'user.json';

  // Check if file exists
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri);
  }

  // Write data
  await FileSystem.writeAsStringAsync(
    uri,
    JSON.stringify(data)
  );

  // Download avatar
  await FileSystem.downloadAsync(
    'https://example.com/avatar.png',
    FileSystem.documentDirectory + 'avatar.png'
  );
}
```

#### After (Modern)

```typescript
import { File, Paths } from 'expo-file-system';

async function saveUserData(data: object) {
  const file = new File(Paths.document, 'user.json');

  // No need to check/delete - write overwrites
  file.write(JSON.stringify(data));

  // Download avatar
  await File.downloadFileAsync(
    'https://example.com/avatar.png',
    new File(Paths.document, 'avatar.png'),
    { idempotent: true }
  );
}
```

---

## Summary

The modern `expo-file-system` API provides a clean, object-oriented interface for file operations in React Native. Key points:

1. **Use `File` and `Directory` classes** for all file operations
2. **Use `Paths`** for directory constants and path utilities
3. **Always handle errors** and check file existence
4. **Use streams and FileHandle** for large files
5. **Remember platform differences** between iOS and Android
6. **Import legacy API** from `expo-file-system/legacy` if needed (for resumable downloads, uploads, SAF)

For the most up-to-date information, refer to the [official Expo FileSystem documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/).
