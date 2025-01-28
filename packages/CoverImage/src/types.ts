export interface VideoCoverPluginConfig {
    /**
     * List of collection slugs to apply the plugin to.
     */
    collections?: string[];

    /**
     * Frame position for thumbnail extraction.
     * - 'start': Extract from the beginning of the video.
     * - 'middle': Extract from the middle of the video.
     * - number: Extract from a specific time (in seconds).
     * @default 'middle'
     */
    framePosition?: 'start' | 'middle' | number;

    /**
     * Output image format for the generated cover image.
     * @default 'webp'
     */
    imageFormat?: 'webp' | 'jpg' | 'png';
}