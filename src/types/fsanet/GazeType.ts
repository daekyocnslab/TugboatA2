/**
 * 시선 처리 데이터 수집 (Gaze)
 */
export type GazeType = {
	left_theta: number; // 왼쪽 눈 시선 수직축 회전각
	left_phi: number; // 왼쪽 눈 시선 횡축 회전각
	// right_theta: number;
	// right_phi: number;
	iris_radius: number;
	ear: number;
};

export type GazeTotalType = {
	left_eyeball_radius: number; // 왼쪽 눈 안구 반지름
	left_eyeball_centre_x: number; // 왼쪽 눈 안구 중심 X
	left_eyeball_centre_y: number; // 왼쪽 눈 안구 중심 Y

	left_iris_centre_x: number; // 왼쪽 눈 홍채 중심 X
	left_iris_centre_y: number; // 왼쪽 눈 홍채 중심 Y
	left_theta: number; // 왼쪽 눈 시선 수직축 회전각
	left_phi: number; // 왼쪽 눈 시선 횡축 회전각

	left_eyeball_landmark: string; // 왼쪽 안구 랜드마크 X, Y 좌표 (Array)
	left_iris_landmark: string; // 왼쪽 홍채 랜드마크 X, Y 좌표 (Array)
	eye_points: number;
	iris_radius: number;
	ear: number;
};

/**
 * 시선 처리 데이터 수집 결과값
 */
export type GazeResultType = {
	theta: number;
	phi: number;
	iris_radius: number;
	ear: number;
};

export type orgGazeResultType = {
	eye_radius: number;
	eyeball_centreX: number;
	eyeball_centreY: number;
	iris_centreX: number;
	iris_centreY: number;
	theta: number;
	phi: number;
	eyeball_landmark: string;
	iris_landmark: string;
	eye_points: any;
	iris_radius: number;
	ear: number;
};
