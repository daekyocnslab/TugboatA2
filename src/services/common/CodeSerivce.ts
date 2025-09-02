import axios, { AxiosResponse } from "axios";
import { CodeType } from "../../types/CodeType";
import { CommonType } from "../../types/common/CommonType";
import { LoginType } from "../../types/LoginType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 코드 관련 API 서비스 입니다.
 */
class CodeService {

    /**
     * [POST] 코드 리스트 조회
     * @param authState 
     * @param requestData 
     * @param isLogin  로그인 여부에 따라 토큰 사용을 다르게 합니다.
     * @returns {Promise<AxiosResponse<CodeType.CodeDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
     */
    selectCodeList = (authState: LoginType.AuthSlice & LoginType.TokenDatas, requestData: CodeType.CodeDto, isLogin: boolean): Promise<AxiosResponse<CodeType.CodeDto & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/code/codes`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: isLogin ? `Bearer ${authState.tokens.access_token}` : `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
     * [POST] 기관 코드 조회
     * @param authState 
     * @param requestData 
     * @returns {Promise<AxiosResponse<CodeType.OrgInfoDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
     */
    selectOrgInfo = (authState: LoginType.TokenDatas, requestData: number): Promise<AxiosResponse<CodeType.OrgInfoDto & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/code/orgInfo`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

}

export default new CodeService();
