import axios, { AxiosResponse } from 'axios';
import { HTTP_METHOD } from '../../common/utils/codes/CommonCode';
import { CommonType } from '../../types/common/CommonType';
import { StudyPlanType } from '../../types/StudyPlanType';
import AxiosUtil from '../../common/utils/AxiosUtil';
import { LoginType } from '../../types/LoginType';
import { StudyType } from '@/types/StudyType';

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;
/**
 * 학습관리 계획 관련 API 서비스 입니다.
 */
class StudyPlanService {
	/**
	 * [POST] 학습 계획 조회
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	selectStudyPlanByAttr = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/studyPlanByAttr`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};

	/**
	 * [POST] 학습 계획 미리보기 조회
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	studyPlanNmByAttr = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/studyPlanNmByAttr`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};

	/**
	 * [POST] 학습 계획 상세 조회
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	selectStudyPlan = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/studyPlanDetail`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};

	/**
	 * [POST] 학습 계획 등록
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	insertStudyPlan = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/studyPlan`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};
	/**
	 * [PUT] 학습 계획 수정
	 * @param authState
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	updateStudyPlan = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.PUT,
			url: `${SERVER_DEFAULT_API}/studyPlan/updateStudyPlan`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};
	/**
	 * [POST] 이번주 계획 학습 스템프 존재여부
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	selectExistPlanStamp = (
		authState: LoginType.TokenDatas,
		requestData: StudyPlanType.ExistStudyPlanStampParam,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/existPlanStamp`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.tokens.access_token}`,
			},
		});
	};
	/**
	 * [POST] 학습 계획 이름 조회
	 * @param userState
	 * @param requestData
	 * @returns
	 */
	studyPlanNmByDoSq = (
		authState: LoginType.AuthSlice,
		requestData: {
			doSq: number;
		},
	): Promise<AxiosResponse<StudyType.StudyPlanInfoType & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/studyPlan/studyPlanByDoSq`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};
}

export default new StudyPlanService();
