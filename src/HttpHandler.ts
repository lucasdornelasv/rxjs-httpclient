import { Observable } from "rxjs";
import { HttpRequest } from "./HttpRequest";
import { HttpEvent } from "./HttpResponse";

export abstract class HttpHandler {
	abstract handle<T = any>(req: HttpRequest<T>): Observable<HttpEvent<T>>;
}
