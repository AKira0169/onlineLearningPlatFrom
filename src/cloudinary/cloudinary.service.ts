import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { v2 as Cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  // Injecting the provider guarantees the singleton has been configured before this service runs.
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary) {}

  /**
   * Port of `courseController.generateSignedUrl` — a time-limited (1h) signed URL for an
   * authenticated Cloudinary video, addressed by its public_id.
   */
  generateSignedUrl(publicId: string): string {
    return this.cloudinary.url(publicId, {
      resource_type: 'video',
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
  }

  /**
   * Open an upstream stream to the signed Cloudinary URL, forwarding the client's `Range` header so
   * Cloudinary answers with `206 Partial Content` when a range is requested. `validateStatus` lets
   * any status (incl. 206 and upstream 4xx) pass through to be relayed rather than thrown.
   */
  async streamAsset(publicId: string, rangeHeader?: string): Promise<AxiosResponse<NodeJS.ReadableStream>> {
    const signedUrl = this.generateSignedUrl(publicId);
    const headers: Record<string, string> = {};
    if (rangeHeader) headers.Range = rangeHeader;

    return axios.get<NodeJS.ReadableStream>(signedUrl, {
      responseType: 'stream',
      headers,
      validateStatus: () => true,
    });
  }
}
