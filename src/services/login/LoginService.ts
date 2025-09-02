import axios, { AxiosResponse } from "axios";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";
import { CommonType } from "../../types/common/CommonType";
import { StudyPlanType } from "../../types/StudyPlanType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { LoginType } from "../../types/LoginType";

const SERVER_DEFAULT_API = process.env.SERVER_DEFAULT_API;

/**
 * 로그인 관련 API 서비스 입니다.
 */
class LoginService {
    /**
    * [POST] 로그인 이력 등록
    * @param {StudyPlanType.StudyPlanDto} requestData
    * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
    */
    insertLoginHis = (authState: LoginType.AuthSlice, requestData: LoginType.LoginHistDto): Promise<AxiosResponse<LoginType.LoginHistDto & CommonType.apiResponseType, any>> => {

        const reqData = AxiosUtil.axiosCall(authState, requestData);
        console.log(SERVER_DEFAULT_API)

        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/login/history`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    /**
    * [POST] 얼굴 인식 요청
    * @param {LoginType.AuthSlice} authState - 인증 토큰 정보
    * @param {FormData} formData - 이미지와 컬렉션 정보가 포함된 FormData
    * @returns {Promise<AxiosResponse<any>>} : 얼굴 인식 결과 반환
    */
    verifyFace = (authState: LoginType.AuthSlice, formData: FormData): Promise<AxiosResponse<any>> => {

        console.log(`${SERVER_DEFAULT_API}/aws/rekognition`);

        return axios({
            method: HTTP_METHOD.POST,
            url:`${SERVER_DEFAULT_API}/aws/rekognition`,
            // url:`https://tgbt-dev-api-stdy.tugboats.kr/api/v1/aws/rekognition`,
            data: formData,
            headers: {
                // Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    registerFace = (authState: LoginType.AuthSlice, formData: FormData): Promise<AxiosResponse<any>> => {
        return axios({
            method: HTTP_METHOD.POST,
            url: `${SERVER_DEFAULT_API}/aws/register`,
            data: formData,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }
}
export default new LoginService();
