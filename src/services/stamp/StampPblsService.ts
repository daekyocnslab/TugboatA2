import axios from "axios";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { LoginType } from "../../types/LoginType";
import { StampPblsType } from "../../types/StampPblsType";

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

class StampPblsService {


    /** 
     * 스템프를 등록합니다.
    */
    insertStampPbls = (authState: LoginType.TokenDatas, requestData: StampPblsType.StampPblsDto) => {

        const reqData = AxiosUtil.axiosCall(authState, requestData);

        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/stampPbls/stampPbls`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }
}
export default new StampPblsService();