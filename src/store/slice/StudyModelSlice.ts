import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { InferenceSession } from 'onnxruntime-react-native';

interface StudyModelSlice {
	isTensorReady: boolean;
	faceMeshModel?: faceLandmarksDetection.FaceLandmarksDetector | null;
	hsemotionModel?: InferenceSession | null;
	fsanetModel?: InferenceSession | null;
	hPoseModel?: InferenceSession | null;
}

/**
 * 관리가 되는 초기 State 값
 */
const initialState: StudyModelSlice = {
	isTensorReady: false, // Tensorflow 모델
	faceMeshModel: null, // fashmesh 모델
	hsemotionModel: null, // hsemotion 모델
	fsanetModel: null, // FSA-NET 모델
	hPoseModel: null, // HPose 모델
};

/**
 * Slice에서 관리가 될 Store 관리
 */
export const UserSlice = createSlice({
	name: 'userInfo',
	initialState,
	reducers: {
		setStudyModel(state, action) {
			state.isTensorReady = action.payload.isTensorReady;
			state.faceMeshModel = action.payload.faceMeshModel;
			state.hsemotionModel = action.payload.hsemotionModel;
			state.fsanetModel = action.payload.fsanetModel;
			state.hPoseModel = action.payload.hPoseModel;
		},
	},
});

export const { setStudyModel } = UserSlice.actions;
export default UserSlice.reducer;
