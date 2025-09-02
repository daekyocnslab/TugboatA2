import axios, { AxiosResponse } from "axios/index";
import { CommonType } from "../../types/common/CommonType";
import { UserType } from "../../types/UserType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { SERVER_DEFAULT_API } from "@env";
import { LoginType } from "../../types/LoginType";


/**
 * 사용자 관련 API 서비스 입니다.
 */
class UserService {

    constructor() {
    }

    /**
     * 회원가입 시, 토큰을 사용하지 않음
     * 사용자 생성
     * ** 해당 상태는 토큰이 생성되지 않은 상태에서 수행을 합니다.
     * @param authState
     * @param requestData
     */
    createUser = (authState: LoginType.AuthSlice, requestData: UserType.UserInfo): Promise<AxiosResponse<Boolean & CommonType.apiResponseType, any>> => {
        console.log(requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/user/createUser`,
            data: requestData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
     * 사용자 조회
     * @param authState
     * @param requestData
     */
    getUser = (authState: LoginType.AuthSlice, requestData: UserType.UserInfo): Promise<AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        console.log();
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/user/selectUser`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.accessToken}`
            },
        });
    }

    /**
     * 사용자 그룹 조회
     * @param authState
     * @param requestData
     */
    getUserGroup = (authState: LoginType.TokenDatas, requestData: UserType.UserInfo): Promise<AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/user/selectUserGroup`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
     * 사용자 정보 
     * 사용자의 정보 수정
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    updateUser = (authState: LoginType.TokenDatas, requestData: UserType.UserInfo): Promise<AxiosResponse<any, any>> => {
        return axios({
            method: HTTP_METHOD.PUT,
            url: `${SERVER_DEFAULT_API}/user/updateUser`,
            data: requestData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
     * 사용자 복귀
     * @param authState 
     * @param requestData 
     * @returns 
     */
    comebackUser = (authState: LoginType.AuthSlice, requestData: UserType.UserInfo): Promise<AxiosResponse<Boolean & CommonType.apiResponseType, any>> => {
        return axios({
            method: HTTP_METHOD.PUT,
            url: `${SERVER_DEFAULT_API}/user/updateUser`,
            data: requestData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }


}

export default new UserService();

