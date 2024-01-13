import { renderAsync } from '@react-email/render';
import * as React from 'react';
import { Resend } from '../resend';
import {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
  CreateEmailResponseSuccess,
  GetEmailResponse,
  GetEmailResponseSuccess,
} from './interfaces';

export class Emails {
  constructor(private readonly resend: Resend) {}

  async send(
    payload: CreateEmailOptions,
    options: CreateEmailRequestOptions = {},
  ) {
    return this.create(payload, options);
  }

  async create(
    payload: CreateEmailOptions,
    options: CreateEmailRequestOptions = {},
  ): Promise<CreateEmailResponse> {
    if (payload.react) {
      payload.html = await renderAsync(payload.react as React.ReactElement);
      delete payload.react;
    }

    const data = await this.resend.post<CreateEmailResponseSuccess>(
      '/send',
      payload,
      options,
    );

    return data;
  }

  async get(id: string): Promise<GetEmailResponse> {
    const data = await this.resend.get<GetEmailResponseSuccess>(
      `/emails/${id}`,
    );
    return data;
  }
}
