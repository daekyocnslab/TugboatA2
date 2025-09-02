// @ts-ignore
import axios, { AxiosResponse } from "axios";
import { HTTP_METHOD } from "../../../src/common/utils/codes/CommonCode";
import { CommonType } from "../../../src/types/common/CommonType";
import { StudyPlanType } from "../../../src/types/StudyPlanType";
import AxiosUtil from "../../common/utils/AxiosUtil";
import { RankType } from "../../types/RankType";
import { LoginType } from "../../types/LoginType";
import { ScoreType } from "../../types/ScoreType";


/**
 * 학습스코어 관련 API 서비스 입니다.
 */
class ScoreService {

    /**
     * [POST] 학습스코어 조회
     * @param authState
     * @param {RankType.RankUserListDto} requestData
     * @returns {Promise<AxiosResponse<StudyPlanType.StudyPlanDto & CommonType.apiResponseType, any>>} : CommonType.apiResponseType 형태로 값을 반환합니다.
     */
    selectScoreList = (authState: LoginType.TokenDatas, requestData: ScoreType.ScoreTodayRequestType): Promise<AxiosResponse<RankType.RankUserListDto & CommonType.apiResponseType, any>> => {

        const reqData = AxiosUtil.axiosCall(authState, requestData);

        return axios({
            method: HTTP_METHOD.POST,
            url: `${process.env.SERVER_DEFAULT_API}/rank/selectRankList`,
            data: reqData,
            headers: {
                Accept: 'application/json',
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.tokens.access_token}`
            },
        });
    }


}

export default new ScoreService();