import axios, { AxiosResponse } from "axios/index";
import { CommonType } from "../../types/common/CommonType";
import { UserType } from "../../types/UserType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { SERVER_DEFAULT_API } from "@env";
import { LoginType } from "../../types/LoginType";
import { OrgType } from "../../types/OrgType";


/**
 * 기관 관련 API 서비스 입니다.
 */
class OrgService {

    constructor() {
    }


    /**
     * 기관 조회
     * @param authState
     * @param requestData
     */
    selectOrgList = (authState: LoginType.TokenDatas, requestData: OrgType.OrgInfo): Promise<AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>> => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/org/selectOrgList`,
            data: reqData,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }


}

export default new OrgService();

