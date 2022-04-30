import { Observable } from "rxjs";
import { HttpHandler } from "./HttpHandler";
import { HttpRequest } from "./HttpRequest";
import { HttpEvent } from "./HttpResponse";

export abstract class HttpAdapter implements HttpHandler {
	abstract handle<T = any>(req: HttpRequest<T>): Observable<HttpEvent<T>>;
}
