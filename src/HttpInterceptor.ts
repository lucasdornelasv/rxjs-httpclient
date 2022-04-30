import { Observable } from "rxjs";
import { HttpHandler } from "./HttpHandler";
import { HttpRequest } from "./HttpRequest";
import { HttpEvent } from "./HttpResponse";

export interface HttpInterceptor {
    /**
     * Identifies and handles a given HTTP request.
     * @param req The outgoing request object to handle.
     * @param next The next interceptor in the chain, or the backend
     * if no interceptors remain in the chain.
     * @returns An observable of the event stream.
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
  }