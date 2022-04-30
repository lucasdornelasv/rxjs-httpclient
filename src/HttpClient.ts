import { defer, Observable, of } from "rxjs";
import { concatMap, filter, map } from "rxjs/operators";
import { HttpAdapter } from "./HttpAdapter";
import { HttpContext } from "./HttpContext";
import { HttpHandler } from "./HttpHandler";
import { HttpHeaders } from "./HttpHeaders";
import { HttpInterceptingManager } from "./HttpInterceptingManager";
import { HttpParams } from "./HttpParams";
import { HttpMethod, HttpRequest, ResponseType } from "./HttpRequest";
import { HttpEvent, HttpResponse } from "./HttpResponse";

type ObserveType = "body" | "events" | "response";

type ParamsLike =
	| HttpParams
	| { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };

type HeadersLike = HttpHeaders | { [header: string]: string | string[] };

type OptionsBody = {
	observe?: "body";
	responseType?: "json";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsBodyArrayBuffer = {
	observe?: "body";
	responseType: "arraybuffer";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsBodyBlob = {
	observe?: "body";
	responseType: "blob";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsBodyText = {
	observe?: "body";
	responseType: "text";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsResponse = {
	observe: "response";
	responseType?: "json";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsResponseArrayBuffer = {
	observe: "response";
	responseType: "arraybuffer";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsResponseBlob = {
	observe: "response";
	responseType: "blob";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsResponseText = {
	observe: "response";
	responseType: "text";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsEvents = {
	observe: "events";
	responseType?: "json";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsEventsArrayBuffer = {
	observe: "events";
	responseType: "arraybuffer";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsEventsBlob = {
	observe: "events";
	responseType: "blob";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type OptionsEventsText = {
	observe: "events";
	responseType: "text";
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

type Options = {
	observe?: ObserveType;
	responseType?: ResponseType;
	reportProgress?: boolean;
	withCredentials?: boolean;
	params?: ParamsLike;
	headers?: HeadersLike;
	context?: HttpContext;
};

export class HttpClient {
	constructor(
		private readonly adapter: HttpAdapter,
		public readonly interceptors?: HttpInterceptingManager
	) {}

	request(req: HttpRequest<any>, options?: { observe?: ObserveType }): Observable<any>;
	request<T>(req: HttpRequest<T>, options?: { observe: "body" }): Observable<T>;
	request<T>(req: HttpRequest<T>, options: { observe: "events" }): Observable<HttpEvent<T>>;
	request<T>(req: HttpRequest<T>, options: { observe: "response" }): Observable<HttpResponse<T>>;
	request(req: HttpRequest<any>, options?: { observe?: ObserveType }): Observable<any> {
		const observeType = options?.observe || "body";

		const events$: Observable<HttpEvent<any>> = defer(() => {
			return this.interceptors?.handle(this.adapter, req) ?? this.adapter.handle(req);
		});

		if (observeType === "events") {
			return events$;
		}

		const res$: Observable<HttpResponse<any>> = <Observable<HttpResponse<any>>>(
			events$.pipe(filter((event: HttpEvent<any>) => event instanceof HttpResponse))
		);

		switch (observeType) {
			case "body":
				switch (req.responseType) {
					case "arraybuffer":
						return res$.pipe(
							map((res: HttpResponse<any>) => {
								// Validate that the body is an ArrayBuffer.
								if (res.body !== null && !(res.body instanceof ArrayBuffer)) {
									throw new Error("Response is not an ArrayBuffer.");
								}
								return res.body;
							})
						);
					case "blob":
						return res$.pipe(
							map((res: HttpResponse<any>) => {
								// Validate that the body is a Blob.
								if (res.body !== null && !(res.body instanceof Blob)) {
									throw new Error("Response is not a Blob.");
								}
								return res.body;
							})
						);
					case "text":
						return res$.pipe(
							map((res: HttpResponse<any>) => {
								// Validate that the body is a string.
								if (res.body !== null && typeof res.body !== "string") {
									throw new Error("Response is not a string.");
								}
								return res.body;
							})
						);
					case "json":
					default:
						// No validation needed for JSON responses, as they can be of any type.
						return res$.pipe(map((res: HttpResponse<any>) => res.body));
				}
			case "response":
				// The response stream was requested directly, so return it.
				return res$;
			default:
				// Guard against new future observe types being added.
				throw new Error(`Unreachable: unhandled observe type ${observeType}}`);
		}
	}

	// get(url: string, options?: Options): Observable<any>;

	get(url: string, options: OptionsBodyArrayBuffer): Observable<ArrayBuffer>;
	get(url: string, options: OptionsBodyBlob): Observable<Blob>;
	get(url: string, options: OptionsBodyText): Observable<string>;
	get(url: string, options: OptionsEventsArrayBuffer): Observable<HttpEvent<ArrayBuffer>>;
	get(url: string, options: OptionsEventsBlob): Observable<HttpEvent<Blob>>;
	get(url: string, options: OptionsEventsText): Observable<HttpEvent<string>>;
	get(url: string, options: OptionsEvents): Observable<HttpEvent<Object>>;
	get<T>(url: string, options: OptionsEvents): Observable<HttpEvent<T>>;
	get(url: string, options: OptionsResponseArrayBuffer): Observable<HttpResponse<ArrayBuffer>>;
	get(url: string, options: OptionsResponseBlob): Observable<HttpResponse<Blob>>;
	get(url: string, options: OptionsResponseText): Observable<HttpResponse<string>>;
	get(url: string, options: OptionsResponse): Observable<HttpResponse<Object>>;
	get<T>(url: string, options: OptionsResponse): Observable<HttpResponse<T>>;
	get(url: string, options?: OptionsBody): Observable<Object>;
	get<T>(url: string, options?: OptionsBody): Observable<T>;
	get(url: string, options: Options = {}): Observable<any> {
		return this._requestInternal(HttpMethod.GET, url, null, options);
	}

	post(url: string, body: any, options: OptionsBodyArrayBuffer): Observable<ArrayBuffer>;
	post(url: string, body: any, options: OptionsBodyBlob): Observable<Blob>;
	post(url: string, body: any, options: OptionsBodyText): Observable<string>;
	post(
		url: string,
		body: any,
		options: OptionsEventsArrayBuffer
	): Observable<HttpEvent<ArrayBuffer>>;
	post(url: string, body: any, options: OptionsEventsBlob): Observable<HttpEvent<Blob>>;
	post(url: string, body: any, options: OptionsEventsText): Observable<HttpEvent<string>>;
	post(url: string, body: any, options: OptionsEvents): Observable<HttpEvent<Object>>;
	post<T>(url: string, body: any, options: OptionsEvents): Observable<HttpEvent<T>>;
	post(
		url: string,
		body: any,
		options: OptionsResponseArrayBuffer
	): Observable<HttpResponse<ArrayBuffer>>;
	post(url: string, body: any, options: OptionsResponseBlob): Observable<HttpResponse<Blob>>;
	post(url: string, body: any, options: OptionsResponseText): Observable<HttpResponse<string>>;
	post(url: string, body: any, options: OptionsResponse): Observable<HttpResponse<Object>>;
	post<T>(url: string, body: any, options: OptionsResponse): Observable<HttpResponse<T>>;
	post(url: string, body: any, options?: OptionsBody): Observable<Object>;
	post<T>(url: string, body: any, options?: OptionsBody): Observable<T>;
	post(url: string, body: any, options: Options = {}): Observable<any> {
		return this._requestInternal(HttpMethod.POST, url, body, options);
	}

	put(url: string, body: any, options: OptionsBodyArrayBuffer): Observable<ArrayBuffer>;
	put(url: string, body: any, options: OptionsBodyBlob): Observable<Blob>;
	put(url: string, body: any, options: OptionsBodyText): Observable<string>;
	put(
		url: string,
		body: any,
		options: OptionsEventsArrayBuffer
	): Observable<HttpEvent<ArrayBuffer>>;
	put(url: string, body: any, options: OptionsEventsBlob): Observable<HttpEvent<Blob>>;
	put(url: string, body: any, options: OptionsEventsText): Observable<HttpEvent<string>>;
	put(url: string, body: any, options: OptionsEvents): Observable<HttpEvent<Object>>;
	put<T>(url: string, body: any, options: OptionsEvents): Observable<HttpEvent<T>>;
	put(
		url: string,
		body: any,
		options: OptionsResponseArrayBuffer
	): Observable<HttpResponse<ArrayBuffer>>;
	put(url: string, body: any, options: OptionsResponseBlob): Observable<HttpResponse<Blob>>;
	put(url: string, body: any, options: OptionsResponseText): Observable<HttpResponse<string>>;
	put(url: string, body: any, options: OptionsResponse): Observable<HttpResponse<Object>>;
	put<T>(url: string, body: any, options: OptionsResponse): Observable<HttpResponse<T>>;
	put(url: string, body: any, options?: OptionsBody): Observable<Object>;
	put<T>(url: string, body: any, options?: OptionsBody): Observable<T>;
	put(url: string, body: any, options: Options = {}): Observable<any> {
		return this._requestInternal(HttpMethod.PUT, url, body, options);
	}

	delete(url: string, options: OptionsBodyArrayBuffer): Observable<ArrayBuffer>;
	delete(url: string, options: OptionsBodyBlob): Observable<Blob>;
	delete(url: string, options: OptionsBodyText): Observable<string>;
	delete(url: string, options: OptionsEventsArrayBuffer): Observable<HttpEvent<ArrayBuffer>>;
	delete(url: string, options: OptionsEventsBlob): Observable<HttpEvent<Blob>>;
	delete(url: string, options: OptionsEventsText): Observable<HttpEvent<string>>;
	delete(url: string, options: OptionsEvents): Observable<HttpEvent<Object>>;
	delete<T>(url: string, options: OptionsEvents): Observable<HttpEvent<T>>;
	delete(url: string, options: OptionsResponseArrayBuffer): Observable<HttpResponse<ArrayBuffer>>;
	delete(url: string, options: OptionsResponseBlob): Observable<HttpResponse<Blob>>;
	delete(url: string, options: OptionsResponseText): Observable<HttpResponse<string>>;
	delete(url: string, options: OptionsResponse): Observable<HttpResponse<Object>>;
	delete<T>(url: string, options: OptionsResponse): Observable<HttpResponse<T>>;
	delete(url: string, options?: OptionsBody): Observable<Object>;
	delete<T>(url: string, options?: OptionsBody): Observable<T>;
	delete(url: string, options: Options = {}): Observable<any> {
		return this._requestInternal(HttpMethod.DELETE, url, null, options);
	}

	private _requestInternal(method: HttpMethod, url: string, body: any, options: Options = {}) {
		let { observe, params, headers, context } = options;

		if (!(params instanceof HttpParams)) {
			params = new HttpParams({
				fromObject: params,
			});
		}

		if (!(headers instanceof HttpHeaders)) {
			headers = new HttpHeaders(headers);
		}

		const req = new HttpRequest({
			method,
			url,
			body,
			headers,
			params,
			context,
			responseType: options.responseType,
			reportProgress: options.reportProgress,
			withCredentials: options.withCredentials,
		});

		return this.request<any>(req, { observe: observe as any });
	}
}

var client = new HttpClient(null, null);

var a = client.get(null, { responseType: "arraybuffer", observe: "body" });
