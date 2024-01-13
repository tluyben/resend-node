import { version } from '../package.json';
import { ApiKeys } from './api-keys/api-keys';
import { Audiences } from './audiences/audiences';
import { Batch } from './batch/batch';
import { GetOptions, PostOptions, PutOptions } from './common/interfaces';
import { PatchOptions } from './common/interfaces/patch-option.interface';
import { Contacts } from './contacts/contacts';
import { Domains } from './domains/domains';
import { Emails } from './emails/emails';
import { isResendErrorResponse } from './guards';
import { ErrorResponse } from './interfaces';
import fs from 'fs';
import { basename } from 'path';

const defaultBaseUrl = 'https://d274-79-144-88-223.ngrok-free.app';
const defaultUserAgent = `resend-node:${version}`;
const baseUrl =
  typeof process !== 'undefined' && process.env
    ? process.env.RESEND_BASE_URL || defaultBaseUrl
    : defaultBaseUrl;
const userAgent =
  typeof process !== 'undefined' && process.env
    ? process.env.RESEND_USER_AGENT || defaultUserAgent
    : defaultUserAgent;

export class Resend {
  private readonly headers: Headers;

  readonly apiKeys = new ApiKeys(this);
  readonly audiences = new Audiences(this);
  readonly batch = new Batch(this);
  readonly contacts = new Contacts(this);
  readonly domains = new Domains(this);
  readonly emails = new Emails(this);

  constructor(readonly key?: string) {
    if (!key) {
      if (typeof process !== 'undefined' && process.env) {
        this.key = process.env.RESEND_API_KEY;
      }

      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Resend("re_123")`',
        );
      }
    }

    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      'User-Agent': userAgent,
      'Content-Type': 'application/json',
    });
  }

  async fetchRequest<T>(
    path: string,
    options = {},
  ): Promise<{ data: T | null; error: ErrorResponse | null }> {
    const response = await fetch(`${baseUrl}${path}`, options);

    if (!response.ok) {
      const error = await response.json();
      if (isResendErrorResponse(error)) {
        return { data: null, error };
      }

      return { data: null, error };
    }

    const data = await response.json();
    return { data, error: null };
  }

  async post<T>(path: string, entity?: unknown, options: PostOptions = {}) {
    if ((entity as any)?.attachments) {
      for (const e of (entity as any).attachments) {
        if (!e.content) {
          if (e.filepath) {
            e.content = await fs.promises.readFile(e.filepath);
            e.filename = basename(e.filepath);
          } else if (e.filename) {
            e.content = await fs.promises.readFile(e.filename);
            e.filename = basename(e.filepath);
            e.filepath = e.filename;
          }
        }
        if (typeof e.content === 'object') {
          e.content = e.content.toString('base64');
        }
      }
    }
    const requestOptions = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    if (requestOptions.body.length > 1024 * 1024) {
      throw new Error(
        `Body too large, expect 1MB, ${requestOptions.body.length} bytes given`,
      );
    }

    return this.fetchRequest<T>(path, requestOptions);
  }

  async get<T>(path: string, options: GetOptions = {}) {
    const requestOptions = {
      method: 'GET',
      headers: this.headers,
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async put<T>(path: string, entity: any, options: PutOptions = {}) {
    const requestOptions = {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async patch<T>(path: string, entity: any, options: PatchOptions = {}) {
    const requestOptions = {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async delete<T>(path: string, query?: unknown) {
    const requestOptions = {
      method: 'DELETE',
      headers: this.headers,
      body: JSON.stringify(query),
    };

    return this.fetchRequest<T>(path, requestOptions);
  }
}
