import axios, { AxiosResponse } from 'axios';
import { LoginType } from '../../types/LoginType';
import { StudyType } from '../../types/StudyType';
import { HTTP_METHOD } from '../../../src/common/utils/codes/CommonCode';
import { CommonType } from '../../../src/types/common/CommonType';
import { StudyPlanType } from '../../../src/types/StudyPlanType';
import AxiosUtil from '../../common/utils/AxiosUtil';
import { UserType } from '../../types/UserType';

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 출결 관련 API 서비스 입니다.
 */
class AttendanceService {
	/**
	 * [POST] 로그인 사용자 조회
	 * @param authState
	 * @param requestData
	 */
	getUserLoginInfo = (
		authState: LoginType.AuthSlice,
		requestData: {
			loginId: string;
		},
	): Promise<AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);
		console.log(SERVER_DEFAULT_API);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/getUserLoginInfo`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 출결회원 입실
	 * @param authState
	 * @param requestData
	 */
	requestAttendanceIn = (
		authState: LoginType.AuthSlice,
		requestData: LoginType.AttendanceDto,
	): Promise<AxiosResponse<LoginType.LoginHistDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);
		console.log(SERVER_DEFAULT_API);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/requestAttendanceIn`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 출결회원 퇴실
	 * @param authState
	 * @param requestData
	 */
	requestAttendanceOut = (
		authState: LoginType.AuthSlice,
		requestData: LoginType.AttendanceDto,
	): Promise<AxiosResponse<LoginType.LoginHistDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);
		console.log(SERVER_DEFAULT_API);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/requestAttendanceOut`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 학습 계획 등록
	 * @param authState
	 * @param {StudyPlanType.StudyPlanDto} requestData
	 * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
	 */
	readyStudyStrt = (
		authState: LoginType.AuthSlice,
		requestData: StudyPlanType.StudyPlanDto,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${process.env.SERVER_DEFAULT_API}/attd/readyStudyStrt`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};
	/**
	 * 사용자 별 학습 계획을 조회합니다.
	 * @param authState
	 * @param requestData
	 * @returns
	 */
	selectUserSbjtInfo = (
		authState: LoginType.AuthSlice,
		requestData: StudyType.UserSbjtInfo,
	): Promise<AxiosResponse<StudyType.UserSbjtInfo & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);
		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/userSbjtInfo`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * 학습 정보 수정
	 * @param authState
	 * @param requestData
	 * @returns
	 */
	updateStudyInfo = (
		authState: LoginType.AuthSlice,
		requestData: StudyPlanType.UpdateStudyInfoParam,
	): Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);
		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/updateStudyInfo`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};
}

export default new AttendanceService();
