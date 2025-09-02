import axios, { AxiosResponse } from "axios";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { CommonType } from "../../types/common/CommonType";
import { TosType } from "../../types/TosType";
import { LoginType } from "../../types/LoginType";

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 약관 관련 API 서비스 입니다.
 */
class TosService {

    /**
     * 회원가입 시, 토큰을 사용하지 않음
     * [POST] 이용약관 조회
     * @param {TosType.TosInfoDto} requestData
     * @returns {Promise<AxiosResponse<TosType.TosInfoDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
     */
    selectTosInfo = (authState: LoginType.AuthSlice, requestData: TosType.TosInfoDto): Promise<AxiosResponse<TosType.TosInfoDto & CommonType.apiResponseType, any>> => {
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/tos/tosInfo`,
            data: requestData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
     * [POST] 약관 동의 내역 추가하기
     * @param authState
     * @param requestData
     */
    insertTosOk = (authState: LoginType.AuthSlice, requestData: TosType.TosOkDto): Promise<AxiosResponse<TosType.TosInfoDto & CommonType.apiResponseType, any>> => {
        console.log(requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/tos/insertTosOk`,
            data: requestData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }
}

export default new TosService();
