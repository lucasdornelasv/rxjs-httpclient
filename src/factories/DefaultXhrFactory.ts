import { XhrFactory } from "../XhrFactory";

export class DefaultXhrFactory extends XhrFactory {
	build(): XMLHttpRequest {
		return new XMLHttpRequest();
	}
}
