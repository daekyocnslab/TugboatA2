import axios, { AxiosResponse } from 'axios';
import AxiosUtil from '../../common/utils/AxiosUtil';
import { HTTP_METHOD } from '../../common/utils/codes/CommonCode';
import { LoginType } from '../../types/LoginType';
import { ReportType } from 'types/ReportType';
import { CommonType } from '@/types/CommonType';
import { StudyType } from '@/types/StudyType';

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

class AttdService {
	/**
	 * 스템프를 등록합니다.
	 */
	selectATodayStdyInfo = (authState: LoginType.AuthSlice, requestData?: ReportType.ReportTodayReqDto) => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/selectATodayStdyInfo`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * 스템프를 등록합니다.
	 */
	selectTugboatAncReportData = (authState: LoginType.AuthSlice, requestData?: ReportType.ReportTodayReqDto) => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/selectTugboatAncReportData`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};

	/**
	 * [POST] 과목 변경 이후 새롭게 구성
	 * @param userState
	 * @param requestData
	 * @returns
	 */
	readyStudyStrt = (
		authState: LoginType.AuthSlice,
		requestData: any,
	): Promise<AxiosResponse<StudyType.StudyPlanInfoType & CommonType.apiResponseType, any>> => {
		const reqData = AxiosUtil.axiosCall(authState, requestData);

		return axios({
			method: HTTP_METHOD.POST,
			url: `${SERVER_DEFAULT_API}/attd/readyStudyStrt`,
			data: reqData,
			headers: {
				Accept: 'application/json',
				'content-Type': 'application/json',
				Authorization: `Bearer ${authState.adminCliAccessToken}`,
			},
		});
	};
}
export default new AttdService();
