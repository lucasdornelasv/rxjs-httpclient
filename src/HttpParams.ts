import { HttpClientDefaults } from "./HttpClientDefaults";
import { HttpParameterCodec } from "./HttpParameterCodec";
import { HttpUrlEncodingCodec } from "./parameter-codecs/HttpUrlEncodingCodec";

function paramParser(rawParams: string, codec: HttpParameterCodec): Map<string, string[]> {
	const map = new Map<string, string[]>();
	if (rawParams.length > 0) {
		// The `window.location.search` can be used while creating an instance of the `HttpParams` class
		// (e.g. `new HttpParams({ fromString: window.location.search })`). The `window.location.search`
		// may start with the `?` char, so we strip it if it's present.
		const params: string[] = rawParams.replace(/^\?/, "").split("&");
		params.forEach((param: string) => {
			const eqIdx = param.indexOf("=");
			const [key, val]: string[] =
				eqIdx == -1
					? [codec.decodeKey(param), ""]
					: [codec.decodeKey(param.slice(0, eqIdx)), codec.decodeValue(param.slice(eqIdx + 1))];
			const list = map.get(key) || [];
			list.push(val);
			map.set(key, list);
		});
	}
	return map;
}

function valueToString(value: string | number | boolean): string {
	return `${value}`;
}

interface Update {
	param: string;
	value?: string | number | boolean;
	op: "a" | "d" | "s";
}

export interface HttpParamsOptions {
	/**
	 * String representation of the HTTP parameters in URL-query-string format.
	 * Mutually exclusive with `fromObject`.
	 */
	fromString?: string;

	/** Object map of the HTTP parameters. Mutually exclusive with `fromString`. */
	fromObject?: {
		[param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
	};

	/** Encoding codec used to parse and serialize the parameters. */
	encoder?: HttpParameterCodec;
}

export class HttpParams {
	private map: Map<string, string[]> | null;
	private encoder: HttpParameterCodec;
	private updates: Update[] | null = null;
	private cloneFrom: HttpParams | null = null;

	constructor(options: HttpParamsOptions = {} as HttpParamsOptions) {
		this.encoder = options.encoder ?? HttpClientDefaults.encoder;
		if (!!options.fromString) {
			if (!!options.fromObject) {
				throw new Error(`Cannot specify both fromString and fromObject.`);
			}
			this.map = paramParser(options.fromString, this.encoder);
		} else if (!!options.fromObject) {
			this.map = new Map<string, string[]>();
			Object.keys(options.fromObject).forEach((key) => {
				const value = (options.fromObject as any)[key];
				this.map!.set(key, Array.isArray(value) ? value : [value]);
			});
		} else {
			this.map = null;
		}
	}

	/**
	 * Reports whether the body includes one or more values for a given parameter.
	 * @param param The parameter name.
	 * @returns True if the parameter has one or more values,
	 * false if it has no value or is not present.
	 */
	has(param: string): boolean {
		this.init();
		return this.map!.has(param);
	}

	/**
	 * Retrieves the first value for a parameter.
	 * @param param The parameter name.
	 * @returns The first value of the given parameter,
	 * or `null` if the parameter is not present.
	 */
	get(param: string): string | null {
		this.init();
		const res = this.map!.get(param);
		return !!res ? res[0] : null;
	}

	/**
	 * Retrieves all values for a  parameter.
	 * @param param The parameter name.
	 * @returns All values in a string array,
	 * or `null` if the parameter not present.
	 */
	getAll(param: string): string[] | null {
		this.init();
		return this.map!.get(param) || null;
	}

	/**
	 * Retrieves all the parameters for this body.
	 * @returns The parameter names in a string array.
	 */
	keys(): string[] {
		this.init();
		return Array.from(this.map!.keys());
	}

	/**
	 * Appends a new value to existing values for a parameter.
	 * @param param The parameter name.
	 * @param value The new value to add.
	 * @return A new body with the appended value.
	 */
	append(param: string, value: string | number | boolean): HttpParams {
		return this.clone({ param, value, op: "a" });
	}

	/**
	 * Constructs a new body with appended values for the given parameter name.
	 * @param params parameters and values
	 * @return A new body with the new value.
	 */
	appendAll(params: {
		[param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
	}): HttpParams {
		const updates: Update[] = [];
		Object.keys(params).forEach((param) => {
			const value = params[param];
			if (Array.isArray(value)) {
				value.forEach((_value) => {
					updates.push({ param, value: _value, op: "a" });
				});
			} else {
				updates.push({ param, value: value as string | number | boolean, op: "a" });
			}
		});
		return this.clone(updates);
	}

	/**
	 * Replaces the value for a parameter.
	 * @param param The parameter name.
	 * @param value The new value.
	 * @return A new body with the new value.
	 */
	set(param: string, value: string | number | boolean): HttpParams {
		return this.clone({ param, value, op: "s" });
	}

	/**
	 * Removes a given value or all values from a parameter.
	 * @param param The parameter name.
	 * @param value The value to remove, if provided.
	 * @return A new body with the given value removed, or with all values
	 * removed if no value is specified.
	 */
	delete(param: string, value?: string | number | boolean): HttpParams {
		return this.clone({ param, value, op: "d" });
	}

	/**
	 * Serializes the body to an encoded string, where key-value pairs (separated by `=`) are
	 * separated by `&`s.
	 */
	toString(): string {
		this.init();
		return (
			this.keys()
				.map((key) => {
					const eKey = this.encoder.encodeKey(key);
					// `a: ['1']` produces `'a=1'`
					// `b: []` produces `''`
					// `c: ['1', '2']` produces `'c=1&c=2'`
					return this.map!.get(key)!
						.map((value) => eKey + "=" + this.encoder.encodeValue(value))
						.join("&");
				})
				// filter out empty values because `b: []` produces `''`
				// which results in `a=1&&c=1&c=2` instead of `a=1&c=1&c=2` if we don't
				.filter((param) => param !== "")
				.join("&")
		);
	}

	clone(update?: Update | Update[]): HttpParams {
		const clone = new HttpParams({ encoder: this.encoder } as HttpParamsOptions);
		clone.cloneFrom = this.cloneFrom || this;
		clone.updates = !update ? this.updates?.slice() ?? [] : (this.updates ?? []).concat(update);
		return clone;
	}

	private init() {
		if (this.map === null) {
			this.map = new Map<string, string[]>();
		}
		if (this.cloneFrom !== null) {
			this.cloneFrom.init();
			this.cloneFrom.keys().forEach((key) => this.map!.set(key, this.cloneFrom!.map!.get(key)!));
			this.updates!.forEach((update) => {
				switch (update.op) {
					case "a":
					case "s":
						const base = (update.op === "a" ? this.map!.get(update.param) : undefined) || [];
						base.push(valueToString(update.value!));
						this.map!.set(update.param, base);
						break;
					case "d":
						if (update.value !== undefined) {
							let base = this.map!.get(update.param) || [];
							const idx = base.indexOf(valueToString(update.value));
							if (idx !== -1) {
								base.splice(idx, 1);
							}
							if (base.length > 0) {
								this.map!.set(update.param, base);
							} else {
								this.map!.delete(update.param);
							}
						} else {
							this.map!.delete(update.param);
							break;
						}
				}
			});
			this.cloneFrom = this.updates = null;
		}
	}
}