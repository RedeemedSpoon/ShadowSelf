import {MessageInstance} from 'twilio/lib/rest/api/v2010/account/message';
import type {QueryResult} from './types';
import sharp from 'sharp';

export async function attempt(func: Promise<unknown>): Promise<QueryResult[]> {
  try {
    return (await func) as QueryResult[];
  } catch (error) {
    return error as QueryResult[];
  }
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export async function blobToBase64(blob: Blob) {
  const arr = new Uint8Array(await blob.arrayBuffer());
  const buf = Buffer.from(arr);
  return buf.toString('base64');
}

export async function resizeImage(base64: string) {
  const buffer = Buffer.from(base64, 'base64');
  const resizedBuffer = await sharp(buffer).resize(256, 256).toBuffer();
  return resizedBuffer.toString('base64');
}

export function parseMessage(msg: MessageInstance) {
  return {
    messageID: msg.sid,
    status: msg.status,
    date: msg.dateSent || msg.dateCreated,
    error: msg.errorCode ? `${msg.errorCode}: ${msg.errorMessage || 'unknown error'}` : '',
    body: msg.body,
    from: msg.from,
    to: msg.to,
  };
}

export async function request(url: string, method = 'GET', body?: object) {
  return fetch('http://localhost:3000' + url, {
    headers: {'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined,
    method,
  })
    .then((res) => res.json())
    .catch((err) => err);
}
