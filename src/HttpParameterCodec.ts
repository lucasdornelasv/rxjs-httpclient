export interface HttpParameterCodec {
    encodeKey(key: string): string;
    encodeValue(value: string): string;
  
    decodeKey(key: string): string;
    decodeValue(value: string): string;
  }