// react
import { Platform, StyleSheet } from 'react-native';
import { DeviceType } from '../../../types/common/DeviceType';
import DeviceInfoUtil from '../../../common/utils/DeviceInfoUtil';
import DementionUtils from '../../../common/utils/DementionUtils';

// 플랫폼에 따른 카메라 사이즈를 지정
const CAMERA_SIZE: DeviceType.CameraSize = DeviceInfoUtil.getCameraSize();
const CAMERA_SIZE_HIDE: DeviceType.CameraSize = DeviceInfoUtil.getHideCameraSize();

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils;

const customHeight = 704;

const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#2e3138',
	},
	/**
	 * 영역 0 : 전체 영역
	 */
	container: {
		flex: 1,
		backgroundColor: '#17191c',
	},
	/**
	 * 영역1 : 카메라 및 하단 버튼 영역
	 */
	content: {
		flex: 1,
	},
	camera: {
		position: 'absolute',
		width: widthRelateSize(360),
		height: heightRelateSize(704, 704),
		flex: 1,
		top: -1000,
		left: -1000,
		transform: [{ scaleX: -1 }], // 카메라 출력을 수평으로 뒤집습니다
		zIndex: 1,
		opacity: 0,
	},

	camera2: {
		position: 'absolute',
		width: widthRelateSize(120),
		height: heightRelateSize(120),
		zIndex: 1,
	},

	cameraOnView: {
		position: 'absolute',
		width: widthRelateSize(360),
		height: heightRelateSize(704),
		transform: [{ scaleX: -1 }], // 카메라 출력을 수평으로 뒤집습니다
		// zIndex: 1000000,
		zIndex: 1,
		top: 1,
		opacity: 0.5,
	},

	cameraOnOffView: {
		flexDirection: 'row', // 텍스트와 스위치를 가로로 배치
		alignItems: 'center',
		justifyContent: 'flex-end',
		zIndex: 111,
		marginTop: heightRelateSize(30),
		marginRight: heightRelateSize(20),
	},

	cameraOnSwitch: {
		zIndex: 999,
	},

	cameraOnOffFrame: {
		marginTop: heightRelateSize(17),
		width: widthRelateSize(120),
		height: heightRelateSize(40),
		marginLeft: widthRelateSize(15),
		backgroundColor: '#2e3138',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
		zIndex: 11,
	},
	cameraOnOffTxt: {
		color: '#f0f1f2',
		fontStyle: 'normal',
		letterSpacing: 0,
		marginRight: marginRelateSize(10),
	},
	cameraOnOffTxtDisable: {
		color: '#8390a3',
		fontStyle: 'normal',
		letterSpacing: 0,
	},

	timerFrame: {
		flex: 1,
		flexDirection: 'row',
		width: widthRelateSize(145),
		height: heightRelateSize(69, customHeight),
		left: widthRelateSize(Platform.OS === 'ios' ? -10 : 0),
		marginTop: heightRelateSize(55, customHeight),
		marginLeft: widthRelateSize(101),
		marginBottom: heightRelateSize(12, customHeight),
	},
	stopwatchHourFrame: {
		width: widthRelateSize(145),
		height: heightRelateSize(DeviceInfoUtil.isIPad() ? 53 : 73, customHeight),
	},
	stopwatchHour: {
		width: widthRelateSize(178),
		height: heightRelateSize(73, customHeight),
		fontSize: fontRelateSize(DeviceInfoUtil.isTablet() ? 50 : Platform.OS === 'ios' ? 55 : 60), // TODO: 해당 부분 깨짐증상
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#f0f1f2',
	},

	stopwatchSecFrame: {
		width: widthRelateSize(28),
		height: heightRelateSize(28, customHeight),
		marginLeft: widthRelateSize(Platform.OS === 'ios' ? 30 : 10),
		marginTop: heightRelateSize(19, customHeight),
	},

	stopwatchSec: {
		width: widthRelateSize(24),
		height: heightRelateSize(23, customHeight),
		fontSize: fontRelateSize(18), // TODO: 해당 부분 깨짐증상

		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#747c8a',
	},

	stopwatchSecArea: {
		flexDirection: 'column',
		height: heightRelateSize(69, customHeight),
		width: widthRelateSize(28),
		marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? -27 : 7),
		marginTop: heightRelateSize(8, customHeight),
	},

	faceFrame: {
		marginTop: heightRelateSize(8, customHeight),
		marginLeft: widthRelateSize(Platform.OS === 'ios' ? 32 : 12),
	},

	findFace: {
		width: DeviceInfoUtil.isTablet() ? 12 : 9,
		height: DeviceInfoUtil.isTablet() ? 12 : 9,
		backgroundColor: '#3dcc8e',
		borderRadius: 50,
	},
	notFindFace: {
		width: DeviceInfoUtil.isTablet() ? 12 : 9,
		height: DeviceInfoUtil.isTablet() ? 12 : 9,
		backgroundColor: '#ffcb66',
		borderRadius: 50,
	},

	stopwatchFrame: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: Platform.OS === 'android' ? heightRelateSize(20) : heightRelateSize(0),
		marginBottom: Platform.OS === 'android' ? heightRelateSize(0) : heightRelateSize(20),
		zIndex: 11,
	},

	stopwatchFrame2: {
		flexDirection: 'row',
		width: '100%',
		marginLeft: widthRelateSize(15),
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: Platform.OS === 'android' ? heightRelateSize(20) : heightRelateSize(0),
		// backgroundColor: "red",
		zIndex: 11,
	},

	stopwatchIconFrame: {
		width: widthRelateSize(68),
		height: heightRelateSize(68, customHeight),
	},
	stopwatchAloneIconFrame: {
		width: widthRelateSize(68),
		height: heightRelateSize(68, customHeight),
		marginLeft: widthRelateSize(40),
	},
	stopwatchIcon: {
		width: DeviceInfoUtil.isTablet() ? 70 : 50,
		height: DeviceInfoUtil.isTablet() ? 70 : 50,
	},

	/**
	 * 영역 2: 모달 팝업 관리 : 시작전 학습
	 */
	modalContainer: {
		width: widthRelateSize(304),
		height: heightRelateSize(392),
		marginTop: heightRelateSize(144),
		marginBottom: heightRelateSize(188),
		marginLeft: widthRelateSize(28),
		marginRight: widthRelateSize(28),
		borderRadius: 20,
		backgroundColor: '#2e3138',
	},
	modalContent: {
		marginTop: heightRelateSize(32),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
	},
	modalContent1: {
		marginBottom: heightRelateSize(16),
	},

	title1: {
		width: widthRelateSize(264),
		height: heightRelateSize(18),
		fontSize: fontRelateSize(14),
		marginBottom: heightRelateSize(8),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#616d82',
	},
	title2: {
		width: widthRelateSize(264),
		height: heightRelateSize(20),
		fontSize: fontRelateSize(16),
		marginBottom: heightRelateSize(24),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#f0f1f2',
	},
	emotionArea: {
		width: widthRelateSize(264),
		height: heightRelateSize(210),
		marginBottom: heightRelateSize(16),
	},
	emotionFrame: {
		width: widthRelateSize(264),
		height: heightRelateSize(48), // TODO: 해당 부분에 넘어가는 증상
		borderRadius: 8,
		marginBottom: heightRelateSize(6),
		backgroundColor: '#2d384b',
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#3c414d',
		flex: 1,
		flexDirection: 'column',
	},
	emtionFrameActive: {
		width: widthRelateSize(264),
		height: heightRelateSize(48),
		borderRadius: 8,
		marginBottom: heightRelateSize(6),
		backgroundColor: '#2d384b',
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#6491ff',
	},
	emotionViewFrame: {
		flexDirection: 'row',
	},

	emotionIcon: {
		width: widthRelateSize(28),
		height: heightRelateSize(28),
		marginTop: heightRelateSize(10),
		marginLeft: widthRelateSize(20),
	},

	emotionTxt: {
		width: widthRelateSize(150), // TODO: 가장 긴 사이즈에 맞게 변경 예정
		height: heightRelateSize(24, customHeight),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(15, customHeight),
		marginLeft: widthRelateSize(12),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#aab0be',
	},
	emotionActiveTxt: {
		width: widthRelateSize(150), // TODO: 가장 긴 사이즈에 맞게 변경 예정
		height: heightRelateSize(24, customHeight),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(15, customHeight),
		marginLeft: widthRelateSize(12),

		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
	},
	modalBtnFrame: {
		width: widthRelateSize(264),
		height: heightRelateSize(48),
		borderRadius: 10,
		backgroundColor: '#6491ff',
	},
	modalBtnTxt: {
		width: widthRelateSize(232),
		height: heightRelateSize(20),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(14),
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(16),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#ffffff',
	},

	// 공부 상세보기를 누른 경우
	dtlViewFrame: {
		marginTop: heightRelateSize(425, customHeight),
		// marginTop: heightRelateSize(12, customHeight),
		// flex: 1,
		top: heightRelateSize(Platform.OS === 'ios' ? -20 : 0, customHeight),
		flexDirection: 'column',
		zIndex: 11,
	},

	// 공부 상세보기 버튼을 누르지 않은 경우
	dtlViewNoFrame: {
		bottom: 0,
		marginTop: heightRelateSize(425, customHeight),
		backgroundColor: '#2e3138',
		zIndex: 11,
	},

	/**
	 * 영역 -3 : 비정상적 종료 팝업
	 */
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignContent: 'center',
		textAlignVertical: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
	},
	studyStopModalFrame: {
		width: widthRelateSize(304),
		height: heightRelateSize(204),
		borderRadius: 20,
		backgroundColor: '#2e3138',
		marginLeft: widthRelateSize(28),
		marginRight: widthRelateSize(28),
		marginBottom: heightRelateSize(30),
	},
	studyStopModalTitleFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(106),
		marginTop: heightRelateSize(20),
		marginLeft: widthRelateSize(24),
		marginBottom: heightRelateSize(10),
		flexDirection: 'column',
	},
	stduyStopModalIconFrame: {
		marginLeft: widthRelateSize(103),
		marginRight: widthRelateSize(105),
		marginBottom: heightRelateSize(18),
	},
	stduyStopModalIcon: {
		width: widthRelateSize(48),
		height: heightRelateSize(48),
	},
	studyStopModalTxtFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(60),
	},

	studyStopModalTitle: {
		width: widthRelateSize(256),
		height: heightRelateSize(10),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(22),
		letterSpacing: 0,
		textAlign: 'center',
		color: '#616d82',
		flex: 1,
	},
	studyStopModalBtnFrame: {
		width: heightRelateSize(304),
		height: widthRelateSize(44),
		flex: 1,
		flexDirection: 'row',
	},

	studyStopModalBtnItemFrame: {
		width: heightRelateSize(152),
		height: widthRelateSize(64),
	},

	studyStopModalLeftBtn: {
		width: widthRelateSize(134),
		height: heightRelateSize(16),
		marginTop: heightRelateSize(24),
		marginLeft: widthRelateSize(29),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
	},

	studyStopModalRightBtn: {
		width: widthRelateSize(94),
		height: heightRelateSize(16),
		marginTop: heightRelateSize(24),
		marginLeft: widthRelateSize(15),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
	},

	/**
	 * 영역 2 : 함께 공부중인 학생
	 */
	// 하단에 고정하는 Container 적용
	dtlContainer: {
		position: 'absolute',
		bottom: 0,
	},

	flexRow: {
		flexDirection: 'row',
	},

	peoplesFrame: {
		flexDirection: 'row',
		width: widthRelateSize(328),
		height: heightRelateSize(83, customHeight),
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(16),
		marginBottom: heightRelateSize(12, customHeight),
		borderRadius: 14,
		backgroundColor: '#383d45',
	},

	iconFrame: {
		width: widthRelateSize(44),
		height: heightRelateSize(44, customHeight),
		marginTop: heightRelateSize(19, customHeight),
		marginLeft: widthRelateSize(20),
		marginBottom: heightRelateSize(20, customHeight),
	},
	textFrame: {
		width: widthRelateSize(228),
		height: heightRelateSize(51, customHeight),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(16, customHeight),
		marginLeft: widthRelateSize(16),
		marginBottom: heightRelateSize(20, customHeight),
		marginRight: widthRelateSize(20),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(26, customHeight),
		letterSpacing: 0,
		textAlign: 'left',
		color: '#aab0be',
	},
	/**
	 * 영역3: 알람 텍스트 영역
	 */
	alertFrame: {
		width: widthRelateSize(328),
		height: heightRelateSize(40, customHeight),
		borderRadius: 10,
		backgroundColor: '#4e545e',
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(16),
		marginBottom: heightRelateSize(12, customHeight),
	},

	alertTxt: {
		width: widthRelateSize(296),
		height: heightRelateSize(18, customHeight),
		fontSize: fontRelateSize(14),
		marginLeft: widthRelateSize(16),
		marginTop: heightRelateSize(10, customHeight),
		marginBottom: heightRelateSize(12, customHeight),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
	},
	stdDtlMain: {
		flex: 1,
		flexDirection: 'row',
		width: widthRelateSize(360),
		height: heightRelateSize(Platform.OS === 'ios' ? 90 : 65),
		backgroundColor: '#2e3138',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},

	stdDtlFrame: {
		// flex: 1,
		flexDirection: 'row',
		width: widthRelateSize(360),
		height: heightRelateSize(Platform.OS === 'ios' ? 90 : 55),
		backgroundColor: '#2e3138',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		// bottom: heightRelateSize(Platform.OS === "ios" ? 0 : 15),
		justifyContent: 'center',
		alignItems: 'center',
	},
	stdDtlFrame2: {
		// flex: 1,
		flexDirection: 'row',
		width: widthRelateSize(360),
		height: heightRelateSize(Platform.OS === 'ios' ? 90 : 55),
		// backgroundColor: "#2e3138",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		// bottom: heightRelateSize(Platform.OS === "ios" ? 0 : 15),
		justifyContent: 'center',
		alignItems: 'center',
	},

	stdDtlTxt: {
		width: widthRelateSize(296),
		height: heightRelateSize(22, customHeight),
		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(20),
		// marginTop: heightRelateSize(20, customHeight),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#f0f1f2',
	},
	stdDtlIcon: {
		width: widthRelateSize(20),
		height: heightRelateSize(20, customHeight),
		marginRight: widthRelateSize(20),
	},

	/**
	 * 공부 상세 보기 영역
	 */

	stdDtlViewFrame: {
		flex: 1,
		flexDirection: 'column',
		width: widthRelateSize(360),
		height: heightRelateSize(207, customHeight),
		backgroundColor: '#2e3138',
	},

	tabViewFrame: {
		width: widthRelateSize(328),
		height: heightRelateSize(46, 704),
		marginTop: heightRelateSize(16, customHeight),
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(16),
		borderRadius: 8,
	},

	tabViewArea: {
		height: widthRelateSize(455, customHeight),
		marginLeft: widthRelateSize(6),
		marginRight: widthRelateSize(6),
		marginTop: heightRelateSize(6, customHeight),
		marginBottom: heightRelateSize(6, customHeight),
		borderRadius: 8,
		backgroundColor: '#212429',
	},

	// 공부 모드 탭 영역
	stdyTabFrame: {
		marginLeft: widthRelateSize(6),
		marginRight: widthRelateSize(6),
		marginTop: heightRelateSize(6, 704),
		marginBottom: heightRelateSize(6, 704),
		borderRadius: 8,
		backgroundColor: '#212429',
	},

	stdTabActiveViewFrame: {
		width: widthRelateSize(156),
		height: heightRelateSize(35, 704),
		marginLeft: widthRelateSize(6),
		marginRight: widthRelateSize(12),
		borderRadius: 8,
		marginTop: heightRelateSize(5),
		backgroundColor: '#2e3138',
		justifyContent: 'center',
		alignItems: 'center',
	},
	// 액티브 해제
	stdTabUnActiveViewFrame: {
		width: widthRelateSize(156),
		height: heightRelateSize(34, 704),
		marginTop: heightRelateSize(8, 704),
		marginBottom: heightRelateSize(6, 704),
		marginLeft: widthRelateSize(6),
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},

	/**
	 * 공부 상세 보기 영역
	 */

	stdDtlViewFrame2: {
		flex: 1,
		flexDirection: 'column',
		width: widthRelateSize(360),
		height: heightRelateSize(400),
		backgroundColor: '#2e3138',
	},

	sclTabActiveViewFrame: {
		width: widthRelateSize(156),
		height: heightRelateSize(35, 704),
		marginLeft: widthRelateSize(6),
		marginRight: widthRelateSize(12),
		borderRadius: 8,
		marginTop: heightRelateSize(5),
		backgroundColor: '#2e3138',
		justifyContent: 'center',
		alignItems: 'center',
	},

	// 우리 학교 영역 액티브 해제
	sclTabUnActiveViewFrame: {
		width: widthRelateSize(156),
		height: heightRelateSize(34, 704),
		marginTop: heightRelateSize(8, 704),
		marginBottom: heightRelateSize(6, 704),
		marginLeft: widthRelateSize(6),
		borderRadius: 8,
		justifyContent: 'center',
		alignContent: 'center',
	},

	activeTxt: {
		fontSize: fontRelateSize(15),
		textAlign: 'center',
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		color: '#f0f1f2',
	},

	unActiveTxt: {
		marginBottom: heightRelateSize(6),
		textAlign: 'center',
		fontSize: fontRelateSize(15),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		color: '#8b919e',
	},

	// Tab 관련 스타일
	stdTabViewArea: {
		height: heightRelateSize(455, customHeight),
		width: widthRelateSize(360),
		backgroundColor: '#2e3138',
	},

	area3: {
		flexDirection: 'column',
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: 'black',
		height: heightRelateSize(455, customHeight),
	},

	stdTabViewArea1: {
		flexDirection: 'row',
		marginBottom: heightRelateSize(8),
	},

	stdTabViewFrame1: {
		width: widthRelateSize(164),
		height: heightRelateSize(78, customHeight),
		marginTop: heightRelateSize(20, customHeight),
		marginLeft: widthRelateSize(16),
	},
	stdTabViewTitle: {
		width: widthRelateSize(148),
		height: heightRelateSize(19, customHeight),
		marginLeft: widthRelateSize(8),
		marginTop: heightRelateSize(10, customHeight),
		// marginRight: widthRelateSize(10),
		marginBottom: heightRelateSize(12, customHeight),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	stdTabViewTxt1: {
		width: widthRelateSize(148),
		height: heightRelateSize(20, customHeight),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(8),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12, customHeight),
		marginBottom: heightRelateSize(16, customHeight),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
	},

	stdTabViewFrame2: {
		width: widthRelateSize(164),
		height: heightRelateSize(78, customHeight),
		marginTop: heightRelateSize(20, customHeight),
		marginRight: widthRelateSize(16),
	},

	stdTabViewTxt2: {
		width: widthRelateSize(148),
		height: heightRelateSize(19, customHeight),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(8),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12, customHeight),
		marginBottom: heightRelateSize(16, customHeight),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
	},

	stdTabViewInline: {
		width: widthRelateSize(328),
		height: heightRelateSize(1, customHeight),
		marginLeft: widthRelateSize(16),
		marginTop: heightRelateSize(8, customHeight),
		marginBottom: heightRelateSize(8, customHeight),
		backgroundColor: '#383d45',
	},

	stdTabViewArea2: {
		flexDirection: 'row',
		marginTop: heightRelateSize(8),
	},

	stdTabViewFrame3: {
		width: widthRelateSize(164),
		height: heightRelateSize(78),
		marginTop: heightRelateSize(8),
		marginLeft: widthRelateSize(16),
	},

	stdTabViewGroup3: {
		flex: 1,
		flexDirection: 'row',
	},

	stdTabViewNumTxt3: {
		width: widthRelateSize(21),
		height: heightRelateSize(18),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(62),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'right',
		color: '#64a7ff',
	},

	stdTabViewNumTxtOff3: {
		width: widthRelateSize(29),
		height: heightRelateSize(18),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(64),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'right',
		color: '#64a7ff',
	},

	stdTabViewTxt3: {
		width: widthRelateSize(15),
		height: heightRelateSize(15),

		fontSize: fontRelateSize(12),
		marginLeft: widthRelateSize(4),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(16),
		marginBottom: heightRelateSize(16),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6c7585',
	},

	stdTabViewFrame4: {
		width: widthRelateSize(164),
		height: heightRelateSize(78),
		marginTop: heightRelateSize(8),
	},

	stdTabViewTitle4: {
		width: widthRelateSize(90),
		height: heightRelateSize(17, customHeight),
		marginLeft: widthRelateSize(33),
		marginTop: heightRelateSize(10, customHeight),
		marginRight: widthRelateSize(4),
		marginBottom: heightRelateSize(12, customHeight),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	stdTabViewStrssIcon: {
		width: widthRelateSize(14),
		height: heightRelateSize(14),
		marginTop: heightRelateSize(16),
		marginLeft: widthRelateSize(4),
	},

	stdTabViewNumTxt4: {
		width: widthRelateSize(21),
		height: heightRelateSize(18),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(62),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'right',
		color: '#ffa666',
	},
	stdTabViewNumTxtOff4: {
		width: widthRelateSize(29),
		height: heightRelateSize(18),

		fontSize: fontRelateSize(16),
		marginLeft: widthRelateSize(63),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'right',
		color: '#ffa666',
	},

	stdTabViewTxt4: {
		width: widthRelateSize(15),
		height: heightRelateSize(15),

		fontSize: fontRelateSize(12),
		marginLeft: widthRelateSize(4),
		marginRight: widthRelateSize(8),
		marginTop: heightRelateSize(16),
		marginBottom: heightRelateSize(16),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6c7585',
	},

	peoplesFrame2: {
		flex: 1,
		flexDirection: 'row',
		width: widthRelateSize(328),
		height: heightRelateSize(83),
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(16),
		marginBottom: heightRelateSize(69),
		borderRadius: 14,
		backgroundColor: '#383d45',
	},

	iconFrame2: {
		width: widthRelateSize(44),
		height: heightRelateSize(44),
		marginTop: heightRelateSize(19),
		marginLeft: widthRelateSize(20),
		marginBottom: heightRelateSize(20),
	},
	textFrame2: {
		width: widthRelateSize(228),
		height: heightRelateSize(51),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(16),
		marginLeft: widthRelateSize(16),
		marginRight: widthRelateSize(20),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(26),
		letterSpacing: 0,
		textAlign: 'left',
		color: '#aab0be',
	},

	/**
	 * schoolDtlViewFrame
	 */

	schlDtlViewFrame: {
		width: widthRelateSize(357),
		height: heightRelateSize(455),
		backgroundColor: '#2e3138',
		marginBottom: heightRelateSize(15),
	},
	/**
	 * 우리학교 영역 -1 : 현재 공부중인 친구만 보기 / Switch
	 */
	schlDtlViewArea1: {
		flexDirection: 'row',
		marginTop: heightRelateSize(5),
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginRight: widthRelateSize(16),
	},
	shlDtlView1Txt: {
		width: widthRelateSize(141),
		height: heightRelateSize(16),
		marginRight: widthRelateSize(4),

		fontSize: fontRelateSize(13),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		justifyContent: 'center',
		textAlign: 'left',
		color: '#8b919e',
	},
	schlDtlView1Switch: {
		transform:
			DeviceInfoUtil.getPlatformType() === 'ios' ? [{ scaleX: 0.7 }, { scaleY: 0.7 }] : [{ scaleX: 0.9 }, { scaleY: 0.9 }],
	},

	/**
	 * 우리 학교 영역 -2 : 리스트가 존재하지 않을 경우
	 */
	schlDtlViewNoFrame: {
		width: widthRelateSize(328),
	},
	schlDtlViewNoIcon: {
		width: widthRelateSize(42),
		height: heightRelateSize(42),
		marginLeft: widthRelateSize(145),
		marginRight: widthRelateSize(159),
		marginTop: heightRelateSize(97),
		marginBottom: heightRelateSize(16),
	},
	schlDtlViewNoTxt: {
		width: widthRelateSize(328),
		height: heightRelateSize(16),

		fontSize: fontRelateSize(14),
		marginRight: widthRelateSize(16),
		marginBottom: heightRelateSize(185),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	/**
	 * 우리학교 영역 -3 : 리스트
	 */
	schlDtlViewArea2: {
		height: '100%',
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: widthRelateSize(DeviceInfoUtil.isIPad() ? 380 : 327),
		alignItems: 'center',
		marginLeft: widthRelateSize(16),
		marginBottom: heightRelateSize(55),
	},

	schlDtlViewActiveItem1: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		width: widthRelateSize(109),
		height: heightRelateSize(150),
		borderRadius: 12,
		backgroundColor: '#2e3138',
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#6491ff',
	},

	schlDtlViewUnActiveItem1: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		width: widthRelateSize(109),
		height: heightRelateSize(150),
		backgroundColor: '#2e3138',
	},
	schlDtlViewItemImg: {
		width: DeviceInfoUtil.isTablet() ? widthRelateSize(79) : widthRelateSize(69),
		height: DeviceInfoUtil.isTablet() ? heightRelateSize(70) : heightRelateSize(60),
		marginTop: heightRelateSize(Platform.OS === 'ios' ? 2 : 10),
		marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 37 : 17),
		marginRight: widthRelateSize(25),
		marginBottom: heightRelateSize(Platform.OS === 'ios' ? 0 : 8),
	},

	schlDtlViewItemImgOffline: {
		width: DeviceInfoUtil.isTablet() ? widthRelateSize(79) : widthRelateSize(69),
		height: DeviceInfoUtil.isTablet() ? heightRelateSize(70) : heightRelateSize(60),
		marginTop: heightRelateSize(Platform.OS === 'ios' ? 2 : 10),
		marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 37 : 17),
		marginRight: widthRelateSize(25),
		marginBottom: heightRelateSize(Platform.OS === 'ios' ? 0 : 8),
	},

	schlDtlViewItemNickName: {
		width: widthRelateSize(109),
		height: heightRelateSize(14),

		marginBottom: heightRelateSize(6),
		fontSize: fontRelateSize(12),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
	},

	schlDtlViewItemNickNameOffline: {
		width: widthRelateSize(109),
		height: heightRelateSize(14),

		marginBottom: heightRelateSize(6),
		fontSize: fontRelateSize(12),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#4e545e',
	},
	schlDtlViewItemToday: {
		width: widthRelateSize(109),
		height: heightRelateSize(15),

		marginBottom: heightRelateSize(4),
		fontSize: fontRelateSize(13),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
	},

	schlDtlViewItemTodayOffline: {
		width: widthRelateSize(109),
		height: heightRelateSize(15),

		marginBottom: heightRelateSize(4),
		fontSize: fontRelateSize(13),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#4e545e',
	},

	schlDtlViewItemWeek: {
		width: widthRelateSize(109),
		height: heightRelateSize(15),

		fontSize: fontRelateSize(13),
		marginBottom: heightRelateSize(10),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	schlDtlViewItemWeekOffline: {
		width: widthRelateSize(109),
		height: heightRelateSize(15),

		fontSize: fontRelateSize(13),
		marginBottom: heightRelateSize(10),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	schlDtlViewItemInline: {
		width: widthRelateSize(328),
		height: heightRelateSize(1),
		backgroundColor: '#383d45',
		marginBottom: heightRelateSize(17),
	},

	/**
	 * 프로필 상세 영역
	 */

	/**
	 * 프로필 상세 영역 - 1 : 공통 영역
	 */
	profileDtlFrame: {
		flexDirection: 'column',
		width: widthRelateSize(304),
		height: heightRelateSize(530, customHeight),
		borderRadius: 20,
		backgroundColor: '#2e3138',
		marginTop: heightRelateSize(122, customHeight),
		marginLeft: widthRelateSize(28),
		marginRight: widthRelateSize(28),
		marginBottom: widthRelateSize(123, customHeight),
	},

	/**
	 * 프로필 상세 영역 - 2 : 타이틀 영역
	 */
	profileDtlTitleFrame: {
		flexDirection: 'row',
		width: widthRelateSize(304),
		height: heightRelateSize(38),
	},
	profileDtlTitle: {
		width: widthRelateSize(200),
		height: heightRelateSize(22),

		fontSize: fontRelateSize(20),
		marginLeft: widthRelateSize(52),
		marginTop: heightRelateSize(20),
		marginRight: heightRelateSize(8),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
	},
	profileDtlCloseIconFrame: {
		width: widthRelateSize(26),
		height: heightRelateSize(26),
		marginTop: heightRelateSize(18),
	},
	profileDtlCloseIcon: {
		width: widthRelateSize(18),
		height: heightRelateSize(18),
	},

	/**
	 * 프로필 상세 영역 - 2 : 이미지 및 사진 영역
	 */
	profileBadgeFrame: {
		width: widthRelateSize(3076),
		height: heightRelateSize(80),
		marginTop: heightRelateSize(30, customHeight),
	},

	profileBadgeBackground: {
		width: widthRelateSize(80),
		height: heightRelateSize(80),
		backgroundColor: '#383d45',
		marginLeft: widthRelateSize(112),
		marginRight: widthRelateSize(112),
		borderRadius: 30,
	},
	profileBadgeImage: {
		width: widthRelateSize(63),
		height: heightRelateSize(56),
		marginLeft: widthRelateSize(9),
		marginRight: widthRelateSize(12),
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(12),
	},
	profileNicknameFrame: {
		width: widthRelateSize(304),
		height: heightRelateSize(60),
	},
	profileNickname: {
		width: widthRelateSize(256),
		height: heightRelateSize(21),

		fontSize: fontRelateSize(18),
		marginTop: heightRelateSize(16, customHeight),
		marginLeft: widthRelateSize(24),
		marginRight: widthRelateSize(24),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
	},

	/**
	 * 프로필 상세 영역 - 3 : 뱃지 영역
	 */
	badgeFrame: {
		width: widthRelateSize(224),
		height: heightRelateSize(16, customHeight),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
		marginTop: heightRelateSize(20, customHeight),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginBottom: widthRelateSize(12, customHeight),
		borderRadius: 8,
		backgroundColor: '#383d45',
	},
	badgeCntFrame: {
		flex: 1,
		flexDirection: 'row',
		marginTop: heightRelateSize(5, customHeight),
		marginLeft: widthRelateSize(36),
		marginRight: widthRelateSize(36),
		marginBottom: widthRelateSize(20),
	},
	badgeCnt: {
		width: widthRelateSize(224),
		height: heightRelateSize(16, customHeight),
		marginTop: heightRelateSize(20, customHeight),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginBottom: widthRelateSize(16, customHeight),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
	},

	badgeListFrame: {
		width: widthRelateSize(264),
		height: heightRelateSize(144, customHeight),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginTop: heightRelateSize(20, customHeight),
		marginBottom: widthRelateSize(16),
		borderRadius: 8,
		backgroundColor: '#383d45',
	},

	badgeListItem: {
		width: widthRelateSize(64),
		height: heightRelateSize(72, customHeight),
	},

	badgeImg: {
		width: widthRelateSize(64),
		height: heightRelateSize(48, customHeight),
		marginBottom: heightRelateSize(8),
	},
	badgeContainCnt: {
		width: widthRelateSize(64),
		height: heightRelateSize(16, customHeight),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
	},

	todayRankingArea: {
		flexDirection: 'column',
		width: widthRelateSize(264),
		height: heightRelateSize(134, customHeight),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginBottom: heightRelateSize(15, customHeight),
		borderRadius: 8,
		backgroundColor: '#383d45',
	},

	monthRankingArea: {
		flexDirection: 'column',
		width: widthRelateSize(264),
		height: heightRelateSize(134, customHeight),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		borderRadius: 8,
		backgroundColor: '#383d45',
	},

	todayRainkingBestFrame: {
		flexDirection: 'row',
		marginTop: heightRelateSize(12, customHeight),
		width: widthRelateSize(264),
		height: widthRelateSize(40, customHeight),
		marginLeft: widthRelateSize(85),
	},

	todayRankingTitle: {
		width: widthRelateSize(224),
		height: heightRelateSize(16, customHeight),

		fontSize: fontRelateSize(14),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginTop: heightRelateSize(20, customHeight),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
	},

	rankingTitle: {
		width: widthRelateSize(224),
		height: heightRelateSize(16, customHeight),

		fontSize: fontRelateSize(14),
		marginLeft: widthRelateSize(20),
		marginRight: widthRelateSize(20),
		marginTop: heightRelateSize(20, customHeight),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#aab0be',
	},

	monthlyRainkingBestFrame: {
		flexDirection: 'row',
		marginTop: heightRelateSize(12, customHeight),
		width: widthRelateSize(264),
		height: widthRelateSize(40, customHeight),
		marginLeft: widthRelateSize(85),
	},

	rankingBestIcon: {
		width: widthRelateSize(40),
		height: heightRelateSize(40),
	},
	rankingBestNumTxt: {
		height: heightRelateSize(28),

		fontSize: fontRelateSize(24),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'right',
		color: '#f0f1f2',
		marginLeft: widthRelateSize(10),
		marginTop: heightRelateSize(9, customHeight),
	},

	rankingBestTxt: {
		width: widthRelateSize(12),
		height: widthRelateSize(18),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#f0f1f2',
		marginTop: heightRelateSize(18, customHeight),
		marginLeft: widthRelateSize(4),
	},

	nowTimeArea: {
		marginLeft: widthRelateSize(24),
		marginRight: widthRelateSize(24),
		marginTop: heightRelateSize(8, customHeight),
		flexDirection: 'column',
	},

	nowTimeTxt: {
		width: widthRelateSize(216),
		height: widthRelateSize(17),

		fontSize: fontRelateSize(13),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#8b919e',
	},

	congCenteredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignContent: 'center',
		textAlignVertical: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
	},
	congStudyStopModalFrame: {
		width: widthRelateSize(304),
		height: heightRelateSize(299),
		borderRadius: 20,
		backgroundColor: '#ffffff',
		marginBottom: heightRelateSize(30),
	},
	congStudyStopModalTitleFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(106),
		marginBottom: heightRelateSize(10),
		flexDirection: 'column',
	},
	congStduyStopModalIconFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(130),
		marginBottom: heightRelateSize(23),
		marginLeft: widthRelateSize(27),
		marginTop: heightRelateSize(24),
	},

	congStdybackgroundIcon: {
		width: widthRelateSize(256),
		height: heightRelateSize(130),
		position: 'absolute',
	},

	congStdyStampIcon: {
		width: widthRelateSize(65),
		height: heightRelateSize(23),
		marginLeft: widthRelateSize(95),
		marginTop: heightRelateSize(85),
		position: 'absolute',
	},
	congStduyStopModalIcon: {
		width: widthRelateSize(107.6),
		height: heightRelateSize(100),
		marginLeft: widthRelateSize(100),
		marginTop: heightRelateSize(10),
	},
	congStdyMissionTxt: {
		width: widthRelateSize(256),
		height: heightRelateSize(21),

		fontSize: fontRelateSize(18),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		marginTop: heightRelateSize(8),
		color: '#3f4855',
	},

	congModalContentFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(44),
		marginLeft: widthRelateSize(24),
	},

	congModalContentTxt: {
		width: widthRelateSize(256),
		height: heightRelateSize(44),

		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(22),
		letterSpacing: 0,
		color: '#616d82',
		textAlign: 'center',
	},
	congModalMoveTxt: {
		color: '#ff886e',
	},
	congModalBtnFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(64),
		borderRadius: fontRelateSize(12),
		marginLeft: widthRelateSize(24),
	},
	congModalBtnTxt: {
		width: widthRelateSize(256),
		height: heightRelateSize(16),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
		marginTop: heightRelateSize(8),
	},
	congModalBtn: {
		width: widthRelateSize(256),
		height: heightRelateSize(64),
		marginTop: heightRelateSize(23),
	},

	stdEndFrame: {
		width: widthRelateSize(304),
		height: heightRelateSize(194),
		borderRadius: 20,
		backgroundColor: '#ffffff',
	},

	stdEndTitleFrame: {
		width: widthRelateSize(256),
		height: heightRelateSize(106),
		marginBottom: heightRelateSize(10),
		flexDirection: 'column',
	},
	stdEndModalImg: {
		width: DeviceInfoUtil.isTablet() ? widthRelateSize(58) : widthRelateSize(48),
		height: DeviceInfoUtil.isTablet() ? heightRelateSize(58) : heightRelateSize(48),
		marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 113 : 103),
		marginRight: widthRelateSize(105),
		marginBottom: heightRelateSize(16),
	},
	stdEndModalContent: {
		width: widthRelateSize(256),
		height: heightRelateSize(86),
		marginTop: heightRelateSize(32),
		marginLeft: widthRelateSize(20),
		flexDirection: 'column',
	},
	stdEndModalTitle: {
		width: widthRelateSize(256),
		height: heightRelateSize(32),
		fontSize: fontRelateSize(14),
		marginTop: heightRelateSize(5),
		marginBottom: heightRelateSize(3),
		fontWeight: 'normal',
		fontStyle: 'normal',
		textAlign: 'center',
		lineHeight: heightRelateSize(22),
		letterSpacing: 0,
		color: '#616d82',
	},

	stdEndModalBtnFrame: {
		flexDirection: 'row',
		width: widthRelateSize(256),
		height: heightRelateSize(64),
		borderRadius: fontRelateSize(12),
		marginLeft: widthRelateSize(24),
	},
	stdEndModalLeftBtn: {
		width: widthRelateSize(120),
		height: heightRelateSize(64),
		marginTop: heightRelateSize(23),
	},

	stdEndModalLeftBtnTxt: {
		width: widthRelateSize(120),
		height: heightRelateSize(16),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
		marginTop: heightRelateSize(8),
	},
	stdEndModalRightBtn: {
		width: widthRelateSize(120),
		height: heightRelateSize(64),
		marginTop: heightRelateSize(23),
		marginLeft: widthRelateSize(15),
	},

	stdEndModalRightTxt: {
		width: widthRelateSize(120),
		height: heightRelateSize(16),

		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
		marginTop: heightRelateSize(8),
	},
	pomodoroSvgContainer: {
		alignItems: 'center',
		marginBottom: heightRelateSize(10),
	},
	pomodoroTimer: {
		fontSize: fontRelateSize(48),
		fontWeight: 'bold',
		color: 'white', // 타이머 텍스트 색상
	},
	pomodoroTimeSelectionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginVertical: heightRelateSize(10),
	},
	pomodoroTimeButton: {
		marginHorizontal: widthRelateSize(5),
		paddingVertical: heightRelateSize(10),
		paddingHorizontal: widthRelateSize(15),
		borderRadius: 5,
		backgroundColor: '#555', // 버튼 배경색
	},
	pomodoroTimeButtonText: {
		color: 'white',
		fontSize: fontRelateSize(16),
		fontWeight: 'bold',
	},
	pomodoroButtonContainer: {
		flexDirection: 'column',
		marginTop: heightRelateSize(20),
	},
	pomodoroButton: {
		marginTop: heightRelateSize(10),
		marginHorizontal: widthRelateSize(10),
		paddingVertical: heightRelateSize(10),
		paddingHorizontal: widthRelateSize(20),
		borderRadius: widthRelateSize(20),
		backgroundColor: '#6491FF',
	},
	pomodoroButton2: {
		marginTop: heightRelateSize(15),
		marginHorizontal: widthRelateSize(10),
		paddingVertical: heightRelateSize(10),
		paddingHorizontal: widthRelateSize(20),
		borderColor: '#5686E1',
		borderWidth: 1,
		borderRadius: widthRelateSize(20),
		backgroundColor: '#4A4A4A',
	},
	pomodoroStartButton: {
		backgroundColor: '#28a745',
	},
	pomodoroPauseButton: {
		backgroundColor: '#ffc107',
	},
	pomodoroButtonText: {
		color: 'white',
		fontSize: fontRelateSize(18),
		fontWeight: 'bold',
	},
	changeTimerButton: {
		marginTop: heightRelateSize(10),
		paddingVertical: heightRelateSize(10),
		paddingHorizontal: widthRelateSize(20),
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: widthRelateSize(20),
		backgroundColor: '#959595',
	},
	changeTimerButtonText: {
		color: '#2c2b2b',
		fontSize: fontRelateSize(16),
		fontWeight: 'bold',
	},
	centralContent: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
	},

	timerText: {
		color: '#fff',
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(68),
		fontWeight: 'bold',
	},

	/**
	 * 권한 팝업 모달
	 */
	modalContainer2: {
		width: widthRelateSize(304),
		height: heightRelateSize(335),
		borderRadius: 20,
		backgroundColor: '#2e3138',
		marginTop: heightRelateSize(162),
		marginLeft: widthRelateSize(28),
	},
	innerContainer: {
		marginTop: heightRelateSize(32),
		marginLeft: widthRelateSize(20),
	},
	titleArea: {
		height: heightRelateSize(42),
		marginBottom: heightRelateSize(24),
	},
	// title1: {
	//     width: widthRelateSize(264),
	//     height: heightRelateSize(17),
	//     fontFamily: "NanumBarunGothic",
	//     fontSize: fontRelateSize(14),
	//     fontWeight: "normal",
	//     fontStyle: "normal",
	//     letterSpacing: 0,
	//     textAlign: "left",
	//     color: "#aab0be",
	//     marginBottom: heightRelateSize(8)
	// },
	// title2: {
	//     width: widthRelateSize(264),
	//     height: heightRelateSize(19),
	//     fontFamily: "NanumBarunGothic",
	//     fontSize: fontRelateSize(16),
	//     fontWeight: "bold",
	//     fontStyle: "normal",
	//     letterSpacing: 0,
	//     textAlign: "left",
	//     color: "#f0f1f2"
	// },
	titleBottomLine: {
		width: widthRelateSize(264),
		height: heightRelateSize(1),
		backgroundColor: '#383d45',
		marginBottom: heightRelateSize(23),
	},
	permissionArea: {
		height: heightRelateSize(66),
	},
	permissionSubArea: {
		flexDirection: 'row',
		marginBottom: heightRelateSize(3),
	},

	permissionTitle: {
		width: widthRelateSize(83),
		height: heightRelateSize(16),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
	},
	permissionSwitch: {
		marginLeft: widthRelateSize(121),
	},
	permissionContent: {
		marginBottom: heightRelateSize(32),
	},
	permissionContentTxt: {
		width: widthRelateSize(192),
		height: heightRelateSize(40),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(13),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(20),
		letterSpacing: 0,
		textAlign: 'left',
		color: '#8b919e',
	},
	titleBottomLastLine: {
		width: widthRelateSize(264),
		height: heightRelateSize(1),
		backgroundColor: '#383d45',
		marginTop: heightRelateSize(24),
		marginBottom: heightRelateSize(16),
	},
	permissionAlertTxt: {
		width: widthRelateSize(264),
		height: heightRelateSize(40),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(13),
		fontWeight: 'normal',
		fontStyle: 'normal',
		lineHeight: heightRelateSize(20),
		letterSpacing: 0,
		textAlign: 'left',
		color: '#8b919e',
	},
	permissionBottonArea: {
		// flex: 1,
		textAlign: 'center',
		width: widthRelateSize(276),
		height: heightRelateSize(64),
		flexDirection: 'row',
	},
	permissionBottonFrame: {
		zIndex: 1,
		width: widthRelateSize(152),
		height: heightRelateSize(64),
	},
	permissionBottonTxt: {
		zIndex: 1,
		width: widthRelateSize(28),
		height: heightRelateSize(16),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
		marginLeft: widthRelateSize(44),
		marginTop: heightRelateSize(24),
	},

	//학습 완료 모달 스타일 적용
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	endModalContainer: {
		width: widthRelateSize(220),
		height: heightRelateSize(150),
		padding: widthRelateSize(25),
		backgroundColor: '#2E3543',
		borderRadius: widthRelateSize(10),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#6C7A89', // 외곽선
	},
	closeButton: {
		position: 'absolute',
		top: heightRelateSize(10),
		right: widthRelateSize(10),
	},
	closeText: {
		fontSize: fontRelateSize(20),
		color: '#FFFFFF',
	},
	title: {
		fontSize: fontRelateSize(15),
		color: '#FFFFFF',
		fontWeight: 'bold',
		marginBottom: heightRelateSize(30),
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
	},
	button: {
		height: heightRelateSize(48),
		justifyContent: 'center', // ✅ 세로 중앙
		alignItems: 'center', // ✅ 가로 중앙
		borderRadius: 8,
		backgroundColor: '#3E4653',
	},
	unActive: {
		flex: 1,
		paddingVertical: heightRelateSize(12),
		borderRadius: widthRelateSize(8),
		borderColor: '#4A90E2',
		alignItems: 'center',
		marginHorizontal: widthRelateSize(5),
		backgroundColor: '#3E4653',
	},
	buttonText: {
		fontSize: fontRelateSize(14),
		color: '#FFFFFF',
		fontWeight: 600,
	},

	subjectArea: {
		fontSize: fontRelateSize(18),
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: heightRelateSize(10),
		backgroundColor: '#4A4A4A',
	},

	buttonArea: {
		flexDirection: 'row',
		gap: widthRelateSize(10),
		paddingHorizontal: widthRelateSize(20),
	},

	moveBtn: {
		flex: 1,
		backgroundColor: '#4A4A4A',
		paddingVertical: heightRelateSize(15),
		borderRadius: widthRelateSize(8),
		alignItems: 'center',
	},
	moveBtnTxt: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: fontRelateSize(16),
	},
	leaveBtn: {
		flex: 1,
		backgroundColor: '#4A4A4A',
		paddingVertical: heightRelateSize(15),
		borderRadius: widthRelateSize(8),
		alignItems: 'center',
	},
	leaveBtnTxt: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: fontRelateSize(16),
	},
	bottomActionBar: {
		position: 'absolute',
		bottom: heightRelateSize(50),
		left: 0,
		right: 0,
		backgroundColor: '#17191c',
		paddingVertical: heightRelateSize(20),
		paddingHorizontal: widthRelateSize(40),
		alignItems: 'center',
	},
	subjectButton: {
		width: '100%',
		paddingVertical: heightRelateSize(8),
		paddingHorizontal: widthRelateSize(16),
		borderWidth: 1,
		borderColor: '#FFFFFF',
		borderRadius: widthRelateSize(8),
		backgroundColor: '#1C1C1E',
		marginBottom: heightRelateSize(12),
		height: heightRelateSize(80),
		justifyContent: 'center',
	},
	subjectText: {
		fontSize: fontRelateSize(15),
		fontWeight: 'bold',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	footerButtonRow: {
		flexDirection: 'row',
		gap: widthRelateSize(10),
	},
	footerButton: {
		flex: 1,
		backgroundColor: '#1C1C1E',
		paddingVertical: heightRelateSize(24),
		borderRadius: widthRelateSize(8),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#4A90E2',
	},
	footerButtonText: {
		color: '#FFFFFF',
		fontWeight: 'bold',
		fontSize: fontRelateSize(20),
	},
	studyModalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	studyModalBox: {
		width: '90%',
		backgroundColor: '#1c1c1e',
		padding: widthRelateSize(20),
		borderRadius: widthRelateSize(12),
		maxHeight: '80%',
	},
	studyModalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: heightRelateSize(16),
	},
	studyModalTitle: {
		fontSize: fontRelateSize(22),
		fontWeight: 'bold',
		color: '#fff',
	},
	studySubjectButton: {
		backgroundColor: '#2c2c2e',
		paddingVertical: heightRelateSize(24),
		paddingHorizontal: widthRelateSize(16),
		borderRadius: widthRelateSize(8),
		width: '48%',
		alignItems: 'center',
	},
	studySubjectText: {
		color: '#fff',
		fontSize: fontRelateSize(18),
	},
	studyAddButton: {
		backgroundColor: '#4A90E2',
		paddingVertical: heightRelateSize(20),
		paddingHorizontal: widthRelateSize(16),
		borderRadius: widthRelateSize(8),
		width: '100%',
		alignItems: 'center',
		marginTop: heightRelateSize(20),
	},
	studyAddButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: fontRelateSize(20),
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalBox: {
		width: '90%',
		backgroundColor: '#1c1c1e',
		padding: widthRelateSize(20),
		borderRadius: widthRelateSize(12),
		maxHeight: '80%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: heightRelateSize(16),
	},
	title3: {
		fontSize: fontRelateSize(22),
		fontWeight: 'bold',
		color: '#fff',
	},
	closeIcon: {
		width: widthRelateSize(28),
		height: heightRelateSize(28),
	},
	subjectList: {
		gap: heightRelateSize(12),
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	subjectButton3: {
		backgroundColor: '#2c2c2e',
		paddingVertical: heightRelateSize(24),
		paddingHorizontal: widthRelateSize(16),
		borderRadius: 8,
		width: '48%',
		alignItems: 'center',
	},
	subjectText3: {
		color: '#fff',
		fontSize: fontRelateSize(18),
	},
	subjectSpacer: {
		width: '48%',
	},
	addButtonWrapper: {
		marginTop: heightRelateSize(20),
		marginBottom: heightRelateSize(50),
	},
	addButton: {
		backgroundColor: '#4A90E2',
		paddingVertical: heightRelateSize(20),
		paddingHorizontal: widthRelateSize(16),
		borderRadius: 8,
		width: '100%',
		alignItems: 'center',
	},
	addButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: fontRelateSize(20),
	},
	modalOverlay2: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer3: {
		position: 'absolute',
		borderRadius: widthRelateSize(20),
		backgroundColor: '#2e3138',
		marginHorizontal: widthRelateSize(94),
		width: '80%',
		height: '80%',
		paddingHorizontal: widthRelateSize(24),
		paddingVertical: heightRelateSize(40),
		alignItems: 'center',
		flex: 1,
	},
	header2: {
		position: 'relative',
		width: '100%',
		alignItems: 'center',
		marginBottom: heightRelateSize(6),
	},
	headerTitle: {
		fontSize: fontRelateSize(18),
		lineHeight: heightRelateSize(22),
		fontWeight: 'bold',
		color: '#fff',
	},
	closeButton2: {
		position: 'absolute',
		// width: widthRelateSize(20),
		// height: heightRelateSize(20),
		right: 0,
	},
	listContainer: {
		gap: widthRelateSize(15),
		paddingHorizontal: widthRelateSize(20),
		paddingVertical: heightRelateSize(28),
		marginBottom: heightRelateSize(20),
	},
	row2: {
		flexDirection: 'row',
		gap: widthRelateSize(12),
		justifyContent: 'space-between', // 좌우 균등 분배
	},
	rowSingleLeft: {
		justifyContent: 'flex-start',
	},
	subjectButton2: {
		height: heightRelateSize(45),
		width: widthRelateSize(120),
		borderRadius: widthRelateSize(6),
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: widthRelateSize(20),
		paddingVertical: heightRelateSize(8),
		backgroundColor: '#212429',
		borderWidth: 1,
		borderColor: 'transparent',
	},
	subjectButtonSelected: {
		backgroundColor: '#2d384b',
		borderColor: '#6491ff',
	},
	subjectText2: {
		fontSize: fontRelateSize(15),
		color: '#aab0be',
		fontWeight: '700',
		fontFamily: 'NanumBarunGothic',
	},
	subjectTextSelected: {
		color: '#ffffff',
	},

	plusButton: {
		flex: 1,
		height: heightRelateSize(45),
		borderRadius: widthRelateSize(6),
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: '#4A90E2',
	},
	plusText: {
		fontSize: fontRelateSize(15),
		fontWeight: '600',
		color: '#4A90E2',
	},
	rowSingleCenter: {
		justifyContent: 'flex-start', // 기존이 center였다면 변경
	},
	_container: {
		marginTop: heightRelateSize(30),
		alignItems: 'center',
		marginBottom: heightRelateSize(52),
	},
	_iconWrapper: {
		width: widthRelateSize(46),
		height: heightRelateSize(50),
		borderStyle: 'solid',
		borderWidth: widthRelateSize(1),
		borderRadius: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: heightRelateSize(5),
		marginBottom: heightRelateSize(16),
		backgroundColor: '#212429',
		borderColor: '#2E3138',
	},
	_iconImage: {
		width: widthRelateSize(30),
		height: heightRelateSize(30),
	},
	_titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	_titleText: {
		fontSize: fontRelateSize(18),
		fontWeight: '700',
		justifyContent: 'center',
		fontFamily: 'NanumBarunGothic',
		color: '#f0f1f2',
	},
	_replaceIcon: {
		marginLeft: widthRelateSize(6),
		width: widthRelateSize(20),
		height: widthRelateSize(20),
	},
	_circleBox: {
		alignItems: 'center',
		height: widthRelateSize(190),
	},
	_progressOverlay: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
	},
	_timerText: {
		fontSize: fontRelateSize(32),
		fontWeight: '800',
		color: '#EAF2FF',
	},
	_todayText: {
		color: '#90C8FA',
		alignItems: 'center',
		textAlign: 'center',
		fontSize: fontRelateSize(16),
		marginTop: heightRelateSize(20),
		fontWeight: 600,
	},
	_actionContainer: {
		marginTop: heightRelateSize(30),
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
	},
	_actionBox: {
		flexDirection: 'column',
		alignItems: 'center',
	},
	_actionBoxRight: {
		marginLeft: '45%',
	},
	_touchBox: {
		alignItems: 'center',
	},
	_iconWrap: {
		width: widthRelateSize(42),
		height: heightRelateSize(42),
		borderStyle: 'solid',
		borderWidth: 1,
		borderRadius: 51,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: heightRelateSize(8),
	},
	_iconImg: {
		width: widthRelateSize(40),
		height: heightRelateSize(40),
	},
	_labelText: {
		fontSize: fontRelateSize(14),
		fontWeight: '700',
		color: '#fff',
		textAlign: 'center',
	},
	devContainer: {
		width: widthRelateSize(250),
		height: heightRelateSize(370),
		padding: widthRelateSize(25),
		backgroundColor: '#2E3543',
		borderRadius: widthRelateSize(10),
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#6C7A89', // 외곽선
	},
	devButton: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		height: heightRelateSize(30),

		color: '#FFFFFF',
	},

	devTitle: {
		fontSize: fontRelateSize(15),
		color: '#FFFFFF',
		fontWeight: 'bold',
	},
});
export default styles;
