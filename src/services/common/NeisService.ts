import axios, { AxiosInstance, AxiosResponse } from "axios";

import { NeiseRequest } from "../../types/NeisRequest";
import { NeiseResponse } from "../../types/NeisResponse";
import { NeisInterface } from "../../types/NeisInterface";
import { CommonType } from "../../types/common/CommonType";


/**
 * 나이스 관련 API 서비스 입니다.
 */

class NeisService {

    public api: AxiosInstance;

    constructor({ KEY, Type }: NeisInterface.IDefaultArg) {
        console.log('Constructor: KEY=', KEY, 'Type=', Type);
        this.api = axios.create({
            baseURL: process.env.NEIS_BASE_URL,
            params: { KEY: KEY || process.env.NEIS_OPENAPI_KEY, Type: Type || "json" }
        });
        console.log('Axios instance:', this.api);
    }

    getTimetable = async (
        userState,
        args: NeiseRequest.ITimetableRequest,
        schoolType: string
    ): Promise<AxiosResponse<NeiseResponse.ITimeTableResponse & CommonType.apiResponseType, any>> => {
        try {
            const response = await this.api.get(`/${schoolType}`, {
                params: {
                    ...args,
                },
            });
            return response;
        } catch (err) {
            console.error("시간표 데이터를 불러오는 중에 에러가 발생하였습니다.:", err);
            throw err;
        }
    };

    getSchoolSchedule = async (
        userState,
        args: NeiseRequest.IScheduleRequest
    ): Promise<AxiosResponse<String>> => {
        try {
            const response = await this.api.get(`/SchoolSchedule`, {
                params: {
                    ...args,
                },
            });

            return response;
        } catch (err) {
            console.error("학사일정을 불러오는 중에 에러가 발생하였습니다.:", err);
            // Handle the error and return a suitable value or throw an error
            throw err;
        }
    };

    mealServiceDietInfo = async (
        userState,
        args: NeiseRequest.IMealServiceRequest
    ): Promise<AxiosResponse<String>> => {
        try {
            const response = await this.api.get(`/mealServiceDietInfo`, {
                params: {
                    ...args,
                },
            });

            return response;
        } catch (err) {
            console.error("식단정보를 불러오는 중에 에러가 발생하였습니다.:", err);
            // Handle the error and return a suitable value or throw an error
            throw err;
        }
    };

    /**
     * 시/도 교육청 정보 기반 학교 정보 조회 
     * @param {NeiseRequest.ISchoolInfoRequest} args 
     * @returns {Promise<AxiosResponse<String>}
     */
    getSchoolInfo = async (args: NeiseRequest.ISchoolInfoRequest): Promise<AxiosResponse<String>> => {
        try {
            const response = await this.api.get(`/schoolInfo`, {
                params: {
                    ...args,
                },
            });
            return response;
        } catch (err) {
            console.error("학교정보를 불러오는 중에 에러가 발생하였습니다.:", err);
            // Handle the error and return a suitable value or throw an error
            throw err;
        }
    };
    /**
     * 학교 정보 기반 학년/반 정보 조회
     * @param {NeiseRequest.ISchoolInfoRequest} args 
     * @returns {Promise<AxiosResponse<String>>}
     */
    getClassInfo = async (args: NeiseRequest.ISchoolInfoRequest): Promise<AxiosResponse<String>> => {
        try {
            const response = await this.api.get(`/classInfo`, {
                params: {
                    ...args,
                },
            });
            return response;
        } catch (err) {
            console.error("학교정보를 불러오는 중에 에러가 발생하였습니다.:", err);
            // Handle the error and return a suitable value or throw an error
            throw err;
        }
    };


}

export default new NeisService({
    KEY: process.env.NEIS_OPENAPI_KEY,
    Type: "json", // 또는 "xml", 문서 유형을 선택하세요.
});