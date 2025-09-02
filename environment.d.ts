/**
 * 파일은 타입스크립트가 타입을 찾지 못할 경우 참고하는 파일입니다.
 * 보통 전역에서 d.ts로 선언합니다. 아래 코드에서 보듯이 svg,png,ttf 등을 타입스크립트에서 사용하기 위해 모듈 타입을 선언해주는 것입니다.
 */
declare module '*.svg' {
	import { SvgProps } from 'react-native-svg';
	const content: React.FC<SvgProps>;
	export default content;
}

declare module '*.json' {
	const content: any;
	export default content;
}

declare module '*.png' {
	const content: any;
	export default content;
}

declare module '*.db' {
	const content: any;
	export default content;
}

declare module '*.mp3' {
	const content: any;
	export default content;
}

declare module '*.aac' {
	const content: any;
	export default content;
}

declare module '*.onnx' {
	const content: any;
	export default content;
}

declare module '*.ort' {
	const content: any;
	export default content;
}



declare module '@env' {
	export const API_URL: string;
	export const MY_IP: string;
	export const REPEAT_SECOND: number;
	export const SERVER_DEFAULT_API: string;
	export const REACT_NATIVE_APP_MODE: string;
	export const KEYCLOAK_SERVER: string;
	export const KEYCLOAK_REALMS: string;
	export const KEYCLAOK_CLIENT_ID: string;
	export const KEYCLAOK_CLIENT_SECRET: string;
	export const KEYCLOAK_REDIRECT_URI: string;
	export const OPENAPI_KEY: string;
	export const TUGBOAT_API_KEYCLOAK_SERVER: string;
	export const TUGBOAT_SEASON_UUID: string;
	export const TEST: string;
}

