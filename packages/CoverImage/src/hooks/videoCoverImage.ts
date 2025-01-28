import { CollectionBeforeChangeHook } from 'payload';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import { VideoCoverPluginConfig } from '../types';

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Helper function to parse duration string into seconds
function parseDuration(durationString: string): number {
    try {
        const [timePart, millisecondsPart] = durationString.split('.');
        const milliseconds = millisecondsPart ? parseFloat(millisecondsPart) / 1000 : 0;
        const timeParts = timePart.split(':').map(Number);
        const [hours = 0, minutes = 0, seconds = 0] = timeParts.reverse();
        return (hours * 3600) + (minutes * 60) + seconds + milliseconds;
    } catch {
        return 3; // Default duration if parsing fails
    }
}

// Function to extract a frame from a video
function extractFrame(inputPath: string, outputPath: string, framePosition: 'start' | 'middle' | number): Promise<void> {
    return new Promise((resolve, reject) => {
        let duration = 0;

        ffmpeg(inputPath)
            .outputOptions([
                '-f rawvideo',
                '-vframes 1',
            ])
            .output(outputPath)
            .on('start', (cmdline: string) => {
                console.log('Started ffmpeg with command:', cmdline);
            })
            .on('codecData', (data: { duration: string }) => {
                const durationStr = data.duration;
                duration = parseDuration(durationStr);
            })
            .on('end', () => {
                // Calculate the seek time based on the frame position
                const seekTime =
                    framePosition === 'start'
                        ? 0
                        : framePosition === 'middle'
                            ? duration / 2
                            : typeof framePosition === 'number'
                                ? framePosition
                                : duration / 2; // Default to 'middle' if framePosition is invalid

                // Extract the frame at the calculated seek time
                ffmpeg(inputPath)
                    .seekInput(seekTime)
                    .frames(1)
                    .output(outputPath)
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', (err: Error) => {
                        console.error('Error during frame extraction:', err);
                        reject(err);
                    })
                    .run();
            })
            .on('error', (err: Error) => {
                console.error('Error initializing ffmpeg:', err);
                reject(err);
            })
            .run();
    });
}

// Main hook function
export const videoCoverHook = (config: VideoCoverPluginConfig): CollectionBeforeChangeHook => {
    return async ({ data, req, collection }) => {
        'use server'
        // Skip if the file is not a video or if a thumbnail already exists
        if (!req.file || !data.mimeType?.startsWith('video') || data.thumbnailURL) {
            return data;
        }

        try {
            const tempVideoFilePath = `${collection.upload.staticDir}/tmp_${req.file.name}`;
            const outputCoverImagePath = `${collection.upload.staticDir}/coverImage_${req.file.name}.${config.imageFormat || 'webp'}`;

            // Write the uploaded file buffer to a temporary file
            fs.writeFileSync(tempVideoFilePath, req.file.data);

            // Extract a frame from the video
            await extractFrame(tempVideoFilePath, outputCoverImagePath, config.framePosition || 'middle');

            // Create a new media document for the cover image
            const coverImageDoc = await req.payload.create({
                collection: 'media',
                data: { title: `Auto-generated cover image for ${req.file.name}` },
                filePath: outputCoverImagePath,
            });

            // Update the original document with the cover image and thumbnail URL
            data.coverImage = coverImageDoc.id;
            data.thumbnailURL = coverImageDoc.sizes?.thumbnail?.url;
            data.sizes = { thumbnail: { url: data.thumbnailURL } };

            // Clean up temporary files
            fs.unlinkSync(tempVideoFilePath);
            fs.unlinkSync(outputCoverImagePath);

            return data;
        } catch (error) {
            req.payload.logger.error(`Error generating video cover: ${error}`);
            return data;
        }
    };
};