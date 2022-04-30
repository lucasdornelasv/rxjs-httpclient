import { Observable } from "rxjs";
import { HttpInterceptorHandler } from "./handlers/HttpInterceptorHandler";
import { HttpAdapter } from "./HttpAdapter";
import { HttpHandler } from "./HttpHandler";
import { HttpInterceptor } from "./HttpInterceptor";
import { HttpRequest } from "./HttpRequest";
import { HttpEvent } from "./HttpResponse";
import { InterceptorLike } from "./types";

const interceptorsRefMap = new WeakMap<HttpInterceptingManager, InterceptorLike[]>();

export class HttpInterceptingManager {
	private chain: HttpHandler | null = null;

	private get interceptorList() {
		return interceptorsRefMap.get(this);
	}

	constructor(interceptors?: InterceptorLike[]) {
		interceptors = interceptors?.slice() ?? [];
		interceptorsRefMap.set(this, interceptors);
	}

	handle(adapter: HttpAdapter, req: HttpRequest<any>): Observable<HttpEvent<any>> {
		if (this.chain === null) {
			this.chain = this._getInterceptorsResoved().reduceRight(
				(next, interceptor) => new HttpInterceptorHandler(next, interceptor),
				adapter
			);
		}

		return this.chain.handle(req);
	}

	add(interceptor: InterceptorLike) {
		this.interceptorList.push(interceptor);
		this.chain = null;
		return this;
	}

	removeByIndex(index: number) {
		this.interceptorList.splice(index, 1);
		this.chain = null;
	}

	remove(interceptor: InterceptorLike) {
		const list = this.interceptorList;
		const index = list.indexOf(interceptor);
		if (index > -1) {
			list.splice(index, 1);
		}
		this.chain = null;
	}

	private _getInterceptorsResoved(): HttpInterceptor[] {
		return (
			this.interceptorList?.map((item) => {
				if (typeof item === "function") {
					item = item();
				}

				return item;
			}) ?? []
		);
	}
}
