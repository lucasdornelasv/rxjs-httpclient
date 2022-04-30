import { HttpInterceptor } from "./HttpInterceptor";

export type InterceptorLike = HttpInterceptor | (() => HttpInterceptor);