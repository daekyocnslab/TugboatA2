import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * TemplateSlice에서 관리할 상태를 지정합니다.
 */
const StudyPlanSlice = createSlice({
    name: 'studyPlanInfo',
    initialState: {
        useYn: false,
        timerTime: 45,
        studyPlanFnc: null,         // 학습 계획 삭제 함수
        studyPlanType: ""           // 학습 계획 타입(등록/수정)
    },
    reducers: {
        // 모든 사용자 정보를 상태에 저장합니다.
        setStudyPlanState(state, action) {
            state.studyPlanFnc = action.payload.studyPlanFnc;
            state.studyPlanType = action.payload.studyPlanType;
        }
    },
});

// Action creators are generated for each case reducer function
export const { setStudyPlanState } = StudyPlanSlice.actions

export default StudyPlanSlice.reducer
