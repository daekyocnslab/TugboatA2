import axios, { AxiosResponse } from 'axios';
import { HTTP_METHOD } from '../../common/utils/codes/CommonCode';
import { CommonType } from '../../types/common/CommonType';
import { StudyType } from '../../types/StudyType';
import AxiosUtil from '../../common/utils/AxiosUtil';
import { LoginType } from '../../types/LoginType';

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 학습관리 계획 관련 API 서비스 입니다.
 */
class StudyService {
	/**
	 * [POST] 학습 실행 시작 등록
	 *
	 * @param {StudyType.StudyDoStartDto} requestData
	 * @returns {Promise<AxiosResponse<StudyType.StudyDoStartDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	insertStudyDoStart = (
		authState: LoginType.TokenDatas,
		requestData: StudyType.StudyDoStartDto,
	): Promise<AxiosResponse<StudyType.StudyDoStartDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/studyDoStart`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};

	/**
	 * [POST] 학습 실행 상세 등록
	 *
	 * @param {StudyType.StudyDoDtlDto} requestData
	 * @returns {Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	insertStudyDoDtl = (
		authState: LoginType.AuthSlice,
		requestData: StudyType.StudyDoDtlDto,
	): Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/studyDoDtl`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.accessToken}`,
			},
		});
	};

	/**
	 * [POST] 학습 종료 등록
	 *
	 * @param {StudyType.StudyDoEndDto} requestData
	 * @returns {Promise<AxiosResponse<StudyType.StudyDoEndDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	insertStudyDoEnd = (
		authState: LoginType.AuthSlice,
		requestData: StudyType.StudyDoEndDto,
	): Promise<AxiosResponse<StudyType.StudyDoEndDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/studyDoEnd`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 우리학교는 학생들 리스트
	 * @param userState
	 * @param requestData
	 * @returns
	 */
	selectOnlineUserList = (
		authState: LoginType.TokenDatas,
		requestData: StudyType.StudyOnlineUserListDto,
	): Promise<AxiosResponse<StudyType.StudyOnlineUserListDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/selectOnlineUserList`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};

	/**
	 * [POST] 생존 신고용 리얼타임 데이터 적재
	 *
	 * @param {StudyType.StudyDoDtlDto} requestData
	 * @returns {Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	studyDoStatus = (
		authState: LoginType.AuthSlice,
		requestData: { doSq: number; faceDtctYn: boolean },
	): Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/studyDoStatus`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 생존 신고용 리얼타임 데이터 적재
	 *
	 * @param {StudyType.StudyDoDtlDto} requestData
	 * @returns {Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	studyDoDtlList = (
		authState: LoginType.AuthSlice,
		requestData: StudyType.StudyDoDtlSQliteDto[],
	): Promise<AxiosResponse<StudyType.StudyDoDtlDto & CommonType.apiResponseType, any>> => {
		// const reqData = AxiosUtil.axiosCall(authState, requestData);

		console.log('reuqest data :: ', requestData);
		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/studyDoDtlList`,
			data: requestData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * 사용자 오늘의 학습시간 을 조회합니다.
	 * @param authState
	 * @param requestData
	 * @returns
	 */
	selectTodayStdySecs = (
		authState: LoginType.AuthSlice,
		requestData: StudyType.UserSbjtInfo,
	): Promise<AxiosResponse<StudyType.UserSbjtInfo & CommonType.apiResponseType, any>> => {
		// const reqData = AxiosUtil.axiosCall(authState, requestData);
		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/study/todayStdySecs`,
			data: requestData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

}

export default new StudyService();
