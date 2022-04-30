import { Observable } from "rxjs";
import { HttpHandler } from "../HttpHandler";
import { HttpInterceptor } from "../HttpInterceptor";
import { HttpRequest } from "../HttpRequest";
import { HttpEvent } from "../HttpResponse";

export class HttpInterceptorHandler implements HttpHandler {
    constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}
  
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
      return this.interceptor.intercept(req, this.next);
    }
  }