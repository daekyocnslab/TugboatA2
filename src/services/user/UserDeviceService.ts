import axios from "axios";
import { LoginType } from "../../types/LoginType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { UserDeviceType } from "../../types/UserDeviceType";



const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 사용자 디바이스 서비스입니다.
 */
class UserDevicesService {

    /** 
     * 디바이스 등록/수정 삭제를 수행합니다.
    */
    initUserDevice = (authState: LoginType.TokenDatas, requestData: UserDeviceType.ExsistUserDeviceInfo) => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);

        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/userDvc/userDvc`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
      * 사용자 디바이스를 수정합니다..
      * @param authState 
      * @param requestData 
      * @returns 
      */
    updateUserDevice = (authState: LoginType.TokenDatas, requestData: UserDeviceType.UpdateUserDeviceInfo) => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);

        return axios({
            method: HTTP_METHOD.PUT,
            url: `${SERVER_DEFAULT_API}/userDvc/userDvc`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }

    /**
  * 사용자 디바이스 버전을 갱신합니다.
  * @param authState 
  * @param requestData 
  * @returns 
  */
    updateUserDvcVer = (authState: LoginType.TokenDatas, requestData: UserDeviceType.UpdateUserDeviceInfo) => {
        const reqData = AxiosUtil.axiosCall(authState, requestData);

        return axios({
            method: HTTP_METHOD.PUT,
            url: `${SERVER_DEFAULT_API}/userDvc/userDvcVer`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }
}

export default new UserDevicesService();