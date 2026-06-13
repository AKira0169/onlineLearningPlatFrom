import { Request } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

/** Cloudinary's minimum chunk size; chunks below this (except the last) are rejected. */
const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
/** Default chunk size — large enough to keep request overhead low, small enough to be memory-cheap. */
const DEFAULT_CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Custom multer StorageEngine that **streams** the uploaded file straight into Cloudinary —
 * `file.stream` (the live request body) is piped into Cloudinary, so no full-file buffer or temp file
 * is ever held in memory. This is the discriminator vs. the default memory storage `FileInterceptor`
 * would use.
 *
 * For **big videos** it uses `upload_chunked_stream`, which splits the upload into `chunk_size`-sized
 * requests. Unlike `upload_stream` (a single request, capped at Cloudinary's per-request size limit),
 * the chunked uploader supports arbitrarily large files. Each chunk is sent as it arrives, so memory
 * stays bounded to roughly one chunk regardless of total file size.
 *
 * On success it sets `file.filename = result.public_id` (folder-prefixed, e.g. `videos/name-uuid`),
 * preserving the original contract where the lesson's `videoUrl` stores the Cloudinary public_id.
 */
class CloudinaryStreamStorage {
  private readonly chunkSize: number;

  constructor(private readonly options: { folder: string; resourceType?: string; chunkSize?: number }) {
    this.chunkSize = Math.max(options.chunkSize ?? DEFAULT_CHUNK_SIZE, MIN_CHUNK_SIZE);
  }

  _handleFile(
    _req: Request,
    file: Express.Multer.File & { stream: NodeJS.ReadableStream },
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const fileNameWithoutExtension = file.originalname.split('.')[0];
    const publicId = `${fileNameWithoutExtension}-${uuidv4()}`;

    // Multer's contract requires `cb` to fire exactly once. A source-stream error and the upload
    // callback can both fire (e.g. client aborts a large upload mid-flight), so guard against it.
    let settled = false;
    const done = (error?: any, info?: Partial<Express.Multer.File>) => {
      if (settled) return;
      settled = true;
      cb(error, info);
    };

    const uploadStream = cloudinary.uploader.upload_chunked_stream(
      {
        folder: this.options.folder,
        resource_type: this.options.resourceType as 'video',
        type: 'authenticated',
        public_id: publicId,
        chunk_size: this.chunkSize,
      },
      (error, result) => {
        if (error || !result) return done(error ?? new Error('Cloudinary upload failed'));
        // The full result object (public_id/secure_url/bytes) arrives on the final chunk.
        done(null, {
          filename: result.public_id,
          path: result.secure_url,
          size: result.bytes,
        } as Partial<Express.Multer.File>);
      },
    );

    // If the incoming request body errors/aborts, stop the upload and surface the error once.
    file.stream.on('error', err => {
      uploadStream.destroy();
      done(err);
    });

    file.stream.pipe(uploadStream);
  }

  _removeFile(_req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, { resource_type: 'video', type: 'authenticated' }, () => cb(null));
    } else {
      cb(null);
    }
  }
}

/** Build a streaming storage engine for the given Cloudinary folder. */
export const streamingStorage = (folder: string, resourceType = 'video', chunkSize?: number) =>
  new CloudinaryStreamStorage({ folder, resourceType, chunkSize });
