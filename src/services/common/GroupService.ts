import axios, { AxiosResponse } from "axios/index";
import { CommonType } from "../../types/common/CommonType";
import { UserType } from "../../types/UserType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { SERVER_DEFAULT_API } from "@env";
import { LoginType } from "../../types/LoginType";
import { GroupType } from "../../types/GroupType";


/**
 * 그룹 관련 API 서비스 입니다.
 */
class GroupService {

    constructor() {
    }

    /**
     * 그룹 조회
     * @param authState
     * @param requestData
     */
    selectGroupList = (authState: LoginType.TokenDatas, requestData: GroupType.GroupInfo): Promise<AxiosResponse<GroupType.GroupInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/selectGroupList`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
     * 그룹 조회
     * @param authState
     * @param requestData
     */
    selectGroupListByAdmin = (
        authState: LoginType.AuthSlice,
        requestData: GroupType.GroupInfo,
    ): Promise<
        AxiosResponse<GroupType.GroupInfo & CommonType.apiResponseType, any>
    > => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/selectGroupList`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`,
            },
        });
    };


    /**
     * 하위 그룹 조회
     * @param authState
     * @param requestData
     */
    selectSubGroups = (authState: LoginType.TokenDatas, requestData: GroupType.GroupInfo): Promise<AxiosResponse<GroupType.GroupInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/selectSubGroups`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
     * 상위 Top 그룹 조회
     * @param authState
     * @param requestData
     */
    selectTopGroup = (authState: LoginType.TokenDatas, requestData: GroupType.GroupInfo): Promise<AxiosResponse<GroupType.GroupInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/selectTopGroup`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }
    /**
     * 사용자와 그룹을 매핑 조회
     * @param authState
     * @param requestData
     */
    selectGrpUserMap = (authState: LoginType.AuthSlice, requestData: GroupType.GroupUserMapInfo): Promise<AxiosResponse<GroupType.GroupUserMapInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/login/selectLoginUserGrp`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.accessToken}`
            },
        });
    }

    /**
     * 사용자와 그룹을 매핑
     * @param authState
     * @param requestData
     */
    insertGrpUserMap = (authState: LoginType.TokenDatas, requestData: GroupType.GroupUserMapInfo): Promise<AxiosResponse<GroupType.GroupUserMapInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/insertGrpUserMap`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
     * 사용자와 그룹 매핑 삭제
     * @param authState
     * @param requestData
     */
    deleteGrpUserMap = (authState: LoginType.TokenDatas, requestData: GroupType.GroupUserMapInfo): Promise<AxiosResponse<GroupType.GroupUserMapInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.PUT,
            url: `${SERVER_DEFAULT_API}/group/deleteGrpUserMap`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    };

    /**
     * 소속 그룹 및 상위/하위 그룹 조회합니다
     * @param authState 
     * @param requestData 
     * @returns 
     */
    selectGroupAll = (authState: LoginType.TokenDatas, requestData: GroupType.GroupVrfcCdInfo): Promise<AxiosResponse<GroupType.GroupVrfcCdInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/group/groupAll`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }


}

export default new GroupService();

