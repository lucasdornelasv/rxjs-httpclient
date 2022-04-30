import { HttpXhrAdapter } from "./adapters/HttpXhrAdaper";
import { DefaultXhrFactory } from "./factories/DefaultXhrFactory";
import { HttpAdapter } from "./HttpAdapter";
import { HttpClient } from "./HttpClient";
import { HttpInterceptingManager } from "./HttpInterceptingManager";
import { InterceptorLike } from "./types";
import { XhrFactory } from "./XhrFactory";

export class HttpClientBuilder {
	private _xhrFactory: XhrFactory;
	private _httpAdater: HttpAdapter;
	private _httpInterceptors: InterceptorLike[] = [];

	static newClient() {
		return new HttpClientBuilder().build();
	}

	withXhrFactory(xhrFactory: XhrFactory) {
		this._xhrFactory = xhrFactory;
		return this;
	}

	withHttpAdapter(httpAdater: HttpAdapter) {
		this._httpAdater = httpAdater;
		return this;
	}

	addInterceptors(...interceptors: InterceptorLike[]) {
		this._httpInterceptors.push(...interceptors);
		return this;
	}

	build(): HttpClient {
		const httpAdapter = this._httpAdater ?? this._buildHttpXhrAdapter();

		const interceptingManager = new HttpInterceptingManager(this._httpInterceptors);

		return new HttpClient(httpAdapter, interceptingManager);
	}

	private _buildXhrFactory(): XhrFactory {
		return new DefaultXhrFactory();
	}

	private _buildHttpXhrAdapter(): HttpAdapter {
		return new HttpXhrAdapter(this._xhrFactory ?? this._buildXhrFactory());
	}
}
