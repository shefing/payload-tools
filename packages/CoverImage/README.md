# Payload Video Cover Plugin
Automatically generates cover images for video uploads in specified collections.
This feature was written in a linux environment, 
before the payload video component (that has a cover image as well)
It can extract any frame from the video for the cover image (payload component takes the first frame),
and can be used to extract many frame for any purpose. 
This feature was implemented in the flowing way:

## Setup

### 1. Install the Plugin
```bash
npm add @cankan/cover-image

```
### 2. Payload Config (`payload.config.ts`)
```typescript
  plugins: [
    videoCoverPlugin({
      collections: ['media', 'videos'], // Collections to process
      framePosition: 'middle',          // 'start' | 'middle' | number (seconds)
      imageFormat: 'webp',              // 'webp' | 'jpg' | 'png'
    })
  ]
```
or for default values
```typescript
  plugins: [
    videoCoverPlugin({})
  ]
```
---

## Configuration

### 1. Next.js Config (`next.config.mjs`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverSourceMaps: true,
  },
  serverExternalPackages: [
    "ffmpeg-static",
    "fluent-ffmpeg"
  ],
};

export default withPayload(nextConfig);
```

### 2. Docker Setup (`Dockerfile`)
```Dockerfile

# Copy ffmpeg-static binaries
COPY --from=builder /app/node_modules/ffmpeg-static/ ./node_modules/ffmpeg-static/
```
### 3. Install Dependencies
```bash
 npm install fluent-ffmpeg@2.1.2 ffmpeg-static@5.1.0
```
---

## How It Works

1. **When a video is uploaded** to a configured collection:
    - Extracts a frame at the specified `framePosition`
    - Generates a cover image in the chosen `imageFormat`
    - Stores the image in your `media` collection

2. **Auto-adds fields** to your collections:
   ```typescript
   {
     coverImage: string | Media;  // Reference to the generated image
     thumbnailURL: string;        // Direct URL to the thumbnail
     startPosition: number;       // Actual frame position used
   }
   ```

---
## Features

- 🎥 **Automatic thumbnail generation** for video uploads
- ⚙️ **Configurable frame capture position** (`start`, `middle`, or custom seconds)
- 🖼️ **Multiple image formats** (WebP, JPEG, PNG)
- 🐳 **Docker-ready configuration**
- 🛠️ **Auto-adds required fields** (`coverImage`, `thumbnailURL`, `startPosition`)

---

## Troubleshooting

### Error: "FFmpeg not found"
- **Fix on Ubuntu/Debian**:
  ```bash
  sudo apt-get install ffmpeg
  ```
- **Fix on MacOS**:
  ```bash
  brew install ffmpeg
  ```
- **Docker Build Fix**:  
  Ensure your `Dockerfile` includes:
  ```Dockerfile
  RUN apt-get update && apt-get install -y ffmpeg
  COPY --from=builder /app/node_modules/ffmpeg-static/ ./node_modules/ffmpeg-static/
  ```

---

## License

MIT © Shefing
```
