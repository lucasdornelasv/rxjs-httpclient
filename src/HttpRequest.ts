import { HttpContext } from "./HttpContext";
import { HttpHeaders } from "./HttpHeaders";
import { HttpParams } from "./HttpParams";

export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	JSONP = "JSONP",
}

export type ResponseType = "arraybuffer" | "blob" | "json" | "text";

interface HttpRequestInit<T = any> {
	method: HttpMethod;
	url: string;
	body?: T;
	params?: HttpParams;
	headers?: HttpHeaders;
	reportProgress?: boolean;
	responseType?: ResponseType;
	withCredentials?: boolean;
	context?: HttpContext;
}

function mightHaveBody(method: string): boolean {
	switch (method) {
		case "DELETE":
		case "GET":
		case "HEAD":
		case "OPTIONS":
		case "JSONP":
			return false;
		default:
			return true;
	}
}

function isArrayBuffer(value: any): value is ArrayBuffer {
	return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function isBlob(value: any): value is Blob {
	return typeof Blob !== "undefined" && value instanceof Blob;
}

function isFormData(value: any): value is FormData {
	return typeof FormData !== "undefined" && value instanceof FormData;
}

function isUrlSearchParams(value: any): value is URLSearchParams {
	return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}

export class HttpRequest<T> {
	readonly body: T | null = null;
	readonly params: HttpParams;
	readonly headers: HttpHeaders;
	readonly reportProgress: boolean = false;
	readonly withCredentials: boolean = false;
	readonly method: HttpMethod;
	readonly url: string;
	readonly urlWithParams: string;
	readonly responseType: ResponseType;
	readonly context!: HttpContext;

	constructor(options: HttpRequestInit<T>) {
		const url = options.url;

		this.method = options.method;

		if (mightHaveBody(this.method)) {
			this.body = options.body;
		}

		this.reportProgress = !!options.reportProgress;
		this.withCredentials = !!options.withCredentials;
		this.responseType = options.responseType || "json";

		this.context = options.context ?? new HttpContext();

		this.headers = options.headers?.clone() ?? new HttpHeaders();
		this.params = options.params?.clone();

		if (!this.params) {
			this.params = new HttpParams();
			this.urlWithParams = url;
		} else {
			// Encode the parameters to a string in preparation for inclusion in the URL.
			const params = this.params.toString();
			if (params.length === 0) {
				// No parameters, the visible URL is just the URL given at creation time.
				this.urlWithParams = url;
			} else {
				// Does the URL already have query parameters? Look for '?'.
				const qIdx = url.indexOf("?");
				// There are 3 cases to handle:
				// 1) No existing parameters -> append '?' followed by params.
				// 2) '?' exists and is followed by existing query string ->
				//    append '&' followed by params.
				// 3) '?' exists at the end of the url -> append params directly.
				// This basically amounts to determining the character, if any, with
				// which to join the URL and parameters.
				const sep: string = qIdx === -1 ? "?" : qIdx < url.length - 1 ? "&" : "";
				this.urlWithParams = url + sep + params;
			}
		}
	}

	serializeBody(): ArrayBuffer | Blob | FormData | string | null {
		// If no body is present, no need to serialize it.
		if (this.body === null) {
			return null;
		}
		// Check whether the body is already in a serialized form. If so,
		// it can just be returned directly.
		if (
			isArrayBuffer(this.body) ||
			isBlob(this.body) ||
			isFormData(this.body) ||
			isUrlSearchParams(this.body) ||
			typeof this.body === "string"
		) {
			return this.body;
		}
		// Check whether the body is an instance of HttpUrlEncodedParams.
		if (this.body instanceof HttpParams) {
			return this.body.toString();
		}
		// Check whether the body is an object or array, and serialize with JSON if so.
		if (
			typeof this.body === "object" ||
			typeof this.body === "boolean" ||
			Array.isArray(this.body)
		) {
			return JSON.stringify(this.body);
		}
		// Fall back on toString() for everything else.
		return (this.body as any).toString();
	}

	detectContentTypeHeader(): string | null {
		// An empty body has no content type.
		if (this.body === null) {
			return null;
		}
		// FormData bodies rely on the browser's content type assignment.
		if (isFormData(this.body)) {
			return null;
		}
		// Blobs usually have their own content type. If it doesn't, then
		// no type can be inferred.
		if (isBlob(this.body)) {
			return this.body.type || null;
		}
		// Array buffers have unknown contents and thus no type can be inferred.
		if (isArrayBuffer(this.body)) {
			return null;
		}
		// Technically, strings could be a form of JSON data, but it's safe enough
		// to assume they're plain strings.
		if (typeof this.body === "string") {
			return "text/plain";
		}
		// `HttpUrlEncodedParams` has its own content-type.
		if (this.body instanceof HttpParams) {
			return "application/x-www-form-urlencoded;charset=UTF-8";
		}
		// Arrays, objects, boolean and numbers will be encoded as JSON.
		if (
			typeof this.body === "object" ||
			typeof this.body === "number" ||
			typeof this.body === "boolean"
		) {
			return "application/json";
		}
		// No type could be inferred.
		return null;
	}

	clone(
		update: {
			reportProgress?: boolean;
			responseType?: ResponseType;
			withCredentials?: boolean;
			body?: any | null;
			method?: HttpMethod;
			url?: string;
			context?: HttpContext;
			headers?: HttpHeaders;
			params?: HttpParams;
			setHeaders?: { [name: string]: string | string[] };
			setParams?: { [param: string]: string };
		} = {}
	) {
		const method = update.method || this.method;
		const url = update.url || this.url;
		const responseType = update.responseType || this.responseType;

		const body = update.body !== undefined ? update.body : this.body;

		const withCredentials =
			update.withCredentials !== undefined ? update.withCredentials : this.withCredentials;
		const reportProgress =
			update.reportProgress !== undefined ? update.reportProgress : this.reportProgress;

		let headers = update.headers ?? this.headers;
		let params = update.params ?? this.params;

		if (update?.setHeaders) {
			headers = Object.keys(update.setHeaders).reduce(
				(headers, name) => headers.set(name, update.setHeaders![name]),
				headers
			);
		}

		if (update?.setParams) {
			params = Object.keys(update.setParams).reduce(
				(params, param) => params.set(param, update.setParams![param]),
				params
			);
		}

		const context = update?.context ?? this.context;

		return new HttpRequest({
			method,
			url,
			body,
			params,
			headers,
			context,
			reportProgress,
			responseType,
			withCredentials,
		});
	}
}
