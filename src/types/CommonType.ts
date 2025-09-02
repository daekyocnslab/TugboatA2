import { NetInfoConnectedDetails, NetInfoStateType } from '@react-native-community/netinfo';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStateStatus, TextInput } from 'react-native';

/**
 * 공통 타입을 관리하는 모듈
 */
export declare module CommonType {
	/**
	 * Navigation에서 관리되는 화면들 목록 : Camel Case 형태로 관리합니다.
	 */
	export type RootStackPageList = {
		// default
		root: undefined;
		default: undefined;
		// '출석' 관련 화면
		attendance: undefined;
		studyPlan: undefined;
		// '학습' 관련 화면 목록들
		studyBoost: undefined; // 학습(열공)
		studyReport: undefined; // 학습(리포트)
		studyMeditation: undefined; // 6383
		// '얼굴로그인' 관련 화면
		faceLogin: undefined; // 얼굴로그인
		// '카메라로그인' 관련 화면
		cameraLogin: undefined; // 얼굴로그인
		// 로그인 선택
		loginSelect: undefined; // 로그인 선택
		// 대기화면 선택
		touch: undefined; // 대기화면
	};

	/**
	 * API 반환값
	 */
	export type apiResponseType = {
		result: any;
		resultCode: string | number;
		resultMsg: string;
	};

	/**
	 * 부모 컴포넌트에서 자식 컴포넌트로 넘겨주는 props 값
	 */
	export type CommonProps = {
		route: RouteProp<RootStackPageList, any>;
		navigation: StackNavigationProp<RootStackPageList, any>;
		appState: AppStateStatus;
	};

	/**
	 * '네트워크 정보'를 타입으로 관리합니다.
	 */
	export type NetworkInfo = {
		type: NetInfoStateType;
		isConnected: boolean | null;
		details: NetInfoConnectedDetails | null;
		isInternetReachable: boolean | null;
	};

	export type selectItem = {
		label: string;
		value: string;
	};

	/**
	 * Default Text 스타일 지정 Type
	 */
	interface TextWithDefaultProps extends Text {
		defaultProps?: { allowFontScaling?: boolean };
	}
	/**
	 * Default TextInput 스타일 지정 Type
	 */
	interface TextInputWithDefaultProps extends TextInput {
		defaultProps?: { allowFontScaling?: boolean };
	}
}
