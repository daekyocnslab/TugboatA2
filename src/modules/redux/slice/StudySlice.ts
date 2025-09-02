import { createSlice } from "@reduxjs/toolkit";
import { StudyType } from "../../../types/StudyType";


// '학습'에서 관리하는 학습 Redux
const initialState: StudyType.ReduxStudyInfo = {
    score: 0,                           // 학습 집중력 점수
    tensorImageStr: "",                 // 찍힌 텐서 이미지 
    nowTime: "",                        // 찍힌 현재 시간
    isVisibleAtntn: true,               // 집중력 점수 보여주기 
    isVisibleStress: true,              // 스트레스 정도 보여주기
    isVisibleBestMinPicture: true,      // 최고의 1분 사진 보여주기
    planSq: 0,                          // 학습 시퀀스 
    planNm: "",                         // 학습 계획 명
    planType: ""                        // 학습 타입
};

/**
 * TemplateSlice에서 관리할 상태를 지정합니다.
 */
export const StudySlice = createSlice({
    name: 'studyInfo',
    initialState,
    reducers: {

        // 학습 설정 정보를 관리합니다.
        setReduxStudySetInfo(state, action) {
            state.isVisibleAtntn = action.payload.isVisibleAtntn;
            state.isVisibleStress = action.payload.isVisibleStress;
            state.isVisibleBestMinPicture = action.payload.isVisibleBestMinPicture;
        },


        // 최고의 1분 정보를 관리합니다.
        setReduxBestMinute(state, action) {
            state.score = action.payload.score;
            state.tensorImageStr = action.payload.tensorImageStr;
            state.nowTime = action.payload.nowTime;
        },

        // 학습에서 사용하는 학습 계획 정보
        setReduxStudyPlan(state, action) {
            state.planSq = action.payload.planSq;
            state.planType = action.payload.planType;
            state.planNm = action.payload.planNm;
        }

    },
});

// Action creators are generated for each case reducer function
export const { setReduxBestMinute, setReduxStudySetInfo, setReduxStudyPlan } = StudySlice.actions
export { initialState }

export default StudySlice.reducer