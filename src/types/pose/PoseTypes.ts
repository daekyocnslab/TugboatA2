export declare namespace PoseTypes {
	export interface RotatedBbox {
		corners: { x: number; y: number }[];
	}

	export interface Keypoint {
		x: number;
		y: number;
	}

	export interface Pose {
		bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
		keypoints: Keypoint[];
		score: number;
		rotatedBbox: RotatedBbox;
	}

	export interface ProcessedOutput {
		poses: Pose[];
		bestIdx: number;
		maxScore: number;
	}
}
