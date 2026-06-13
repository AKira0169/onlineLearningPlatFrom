import { Request } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom multer StorageEngine that **streams** the uploaded file straight into Cloudinary —
 * `file.stream` (the live request body) is piped into `cloudinary.uploader.upload_stream`, so no
 * full-file buffer or temp file is ever held in memory. This is the discriminator vs. the default
 * memory storage `FileInterceptor` would use.
 *
 * On success it sets `file.filename = result.public_id` (folder-prefixed, e.g. `videos/name-uuid`),
 * preserving the original contract where the lesson's `videoUrl` stores the Cloudinary public_id.
 */
class CloudinaryStreamStorage {
  constructor(private readonly options: { folder: string; resourceType?: string }) {}

  _handleFile(
    _req: Request,
    file: Express.Multer.File & { stream: NodeJS.ReadableStream },
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const fileNameWithoutExtension = file.originalname.split('.')[0];
    const publicId = `${fileNameWithoutExtension}-${uuidv4()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: this.options.folder,
        resource_type: this.options.resourceType as 'video',
        type: 'authenticated',
        public_id: publicId,
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          filename: result.public_id,
          path: result.secure_url,
          size: result.bytes,
        } as Partial<Express.Multer.File>);
      },
    );

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
export const streamingStorage = (folder: string, resourceType = 'video') =>
  new CloudinaryStreamStorage({ folder, resourceType });
