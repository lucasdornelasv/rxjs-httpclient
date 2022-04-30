import { HttpParameterCodec } from "./HttpParameterCodec";
import { HttpUrlEncodingCodec } from "./parameter-codecs/HttpUrlEncodingCodec";

export class HttpClientDefaults {
	private static _encoder: HttpParameterCodec;

	static get encoder() {
		if (!this._encoder) {
			this._encoder = new HttpUrlEncodingCodec();
		}

		return this._encoder;
	}

	static setHttpParameterCodec(encoder: HttpParameterCodec) {
		this._encoder = encoder;
		return this;
	}
}
