// Type declarations for dns-packet module
declare module 'dns-packet' {
  export interface Question {
    type: string | 'SRV' | 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME';
    name: string;
  }

  export interface Answer {
    type: string | 'SRV' | 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME';
    name: string;
    data: any;
    ttl?: number;
  }

  export interface Packet {
    type?: 'query' | 'response';
    id?: number;
    flags?: number;
    questions?: Question[];
    answers?: Answer[];
    additionals?: Answer[];
    authorities?: Answer[];
  }

  export function encode(packet: Packet, buf?: Buffer, offset?: number): Buffer;
  export function decode(buf: Buffer, offset?: number): Packet;
  export function encodingLength(packet: Packet): number;
  export function streamEncode(packet: Packet): Buffer;
  export function streamDecode(buf: Buffer, offset?: number): { packet: Packet; offset: number };
}

