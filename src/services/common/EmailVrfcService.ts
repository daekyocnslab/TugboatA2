import axios, { AxiosResponse } from "axios";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { CommonType } from "../../types/common/CommonType";
import { LoginType } from "../../types/LoginType";
import { EmailType } from "../../types/common/EmailVrfcDto";

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 메일 관련 API 서비스 입니다.
 */
class EmailVrfcService {

    /**
     * 이메일 전송
     * @param {LoginType.AuthSlice} authState
     * @param {EmailType.SendDto} requestData
     * @param {boolean} isLogin : 로그인 여부에 따라 토큰 사용을 다르게합니다.
     */
    sendEmail = (authState: LoginType.AuthSlice & LoginType.TokenDatas, requestData: EmailType.SendDto, isLogin: boolean): Promise<AxiosResponse<EmailType.EmailVrfcDto & CommonType.apiResponseType, any>> => {

        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/emailVrfc/sendEmail`,
            data: requestData,
            headers: {
                "Accept": 'application/json',
                "content-Type": 'application/json',
                "Authorization": isLogin ? `Bearer ${authState.tokens.access_token}` : `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
     * 이메일 검증
     * @param authState
     * @param requestData
     */
    verifyEmail = (authState: LoginType.AuthSlice & LoginType.TokenDatas, requestData: EmailType.VrfcDto, isLogin: boolean): Promise<AxiosResponse<EmailType.EmailVrfcDto & CommonType.apiResponseType, any>> => {
        console.log(requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/emailVrfc/emailVrfc`,
            data: requestData,
            headers: {
                "Accept": 'application/json',
                "content-Type": 'application/json',
                "Authorization": isLogin ? `Bearer ${authState.tokens.access_token}` : `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
     * 최근 이메일 확인 내역 조회
     * @param authState
     * @param requestData
     */
    selectRecentEmailVrfc = (authState: LoginType.TokenDatas, requestData: EmailType.VrfcDto): Promise<AxiosResponse<EmailType.EmailVrfcDto & CommonType.apiResponseType, any>> => {
        console.log(requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/emailVrfc/selectRecentEmailVrfc`,
            data: requestData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }
}

export default new EmailVrfcService();
