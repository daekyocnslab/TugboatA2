import { StyleSheet } from 'react-native';
import DementionUtils from '../../../common/utils/DementionUtils';
import DeviceInfoUtil from '../../../common/utils/DeviceInfoUtil';

const { heightRelateSize, widthRelateSize, marginRelateSize, fontRelateSize } = DementionUtils;

const styles = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: '#f4f4f4',
	},
	container: {
		flex: 1,
		backgroundColor: '#17191C',
		alignItems: 'center',
		paddingTop: 180,
	},
	title: {
		color: '#FFF',
		fontSize: 32,
		marginBottom: 30,
	},
	attendanceInput: {
		width: 360,
		height: 88,
		borderBottomWidth: 1,
		borderBottomColor: '#a7a7a7',
		marginBottom: 40,
		// backgroundColor: '#FFF',
		color: '#F0F1F2',
		textAlign: 'center',
		fontSize: 40,
		paddingHorizontal: 23,
	},
	keyContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 180,
		marginBottom: 80,
	},
	changeLogin: {
		width: 360,
		height: 64,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#6491FF',
		backgroundColor: '#2D384B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 72,
	},
	imageRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		padding: marginRelateSize(10),
	},
	leftImage: {
		width: widthRelateSize(100),
		height: heightRelateSize(50),
		resizeMode: 'contain',
	},
	rightText: {
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		color: '#000000',
	},
	contentsWrapper: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	contents: {
		width: '100%',
		height: '40%',
		backgroundColor: 'white',
	},
	subContents: {
		width: '100%',
		height: '60%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#B8C9D3',
		padding: widthRelateSize(50),
	},
	contentsMain: {
		width: '100%',
		height: '100%',
		backgroundColor: 'red',
		alignItems: 'center',
	},
	header: {
		fontSize: 32,
		fontWeight: '400',
		color: '#fff',
		marginBottom: marginRelateSize(10),
	},
	input: {
		width: '100%',
		fontSize: fontRelateSize(20),
		borderBottomWidth: 3,
		borderBottomColor: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
		letterSpacing: 5,
		color: 'black',
	},
	instruction: {
		fontSize: fontRelateSize(16),
		textAlign: 'center',
		color: '#000000',
		marginTop: heightRelateSize(20),
	},
	keypad: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	key: {
		width: 120, // 가로는 30%로 설정
		height: 88, // 세로는 고정된 높이
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#17191C',
		marginVertical: heightRelateSize(8),
		borderRadius: widthRelateSize(3),
		// borderWidth: 1,
		// borderColor: '#ccc',
	},
	keyText: {
		fontSize: fontRelateSize(20),
		fontWeight: 'bold',


		color: '#fff',
		textAlign: 'center',
		justifyContent: "center",
		alignContent: "center"
	},
	submitKey: {
		backgroundColor: '#007BFF',
		borderWidth: 0,
	},
	submitText: {
		color: '#fff',
		fontSize: fontRelateSize(20),
		fontWeight: 'bold',
	},

	// 모달관련 스타일
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: widthRelateSize(294),
		height: heightRelateSize(200),
		padding: marginRelateSize(24),
		backgroundColor: '#ffffff',
		borderRadius: 20,
		alignItems: 'center',
		textAlign: 'center',
		elevation: 100,
		justifyContent: 'space-between',
	},
	closeButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 1,
	},
	closeIcon: {
		width: widthRelateSize(24),
		height: heightRelateSize(24),
	},
	closeButtonText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	modalImg: {
		width: 50,
		height: 50,
		marginBottom: 10,
		resizeMode: 'contain',
	},
	textContainer: {
		alignItems: 'center',
		marginVertical: 10,
	},
	modalTextTitle: {
		fontSize: fontRelateSize(16),
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 5,
	},
	modalText: {
		fontSize: fontRelateSize(14),
		textAlign: 'center',
		color: '#333',
		marginBottom: 5,
	},
	buttonWrapper: {
		flexDirection: 'row',
		marginTop: 20,
		width: '100%',
		justifyContent: 'space-between',
	},
	cancelButton: {
		flex: 1,
		backgroundColor: '#333',
		paddingVertical: 10,
		borderRadius: 27.5,
		marginRight: 5,
		alignItems: 'center',
	},
	cancelButtonText: {
		color: '#fff',
		fontSize: fontRelateSize(14),
	},
	confirmButton: {
		flex: 1,
		backgroundColor: '#4a90e2',
		paddingVertical: 10,
		borderRadius: 27.5,
		marginLeft: 5,
		alignItems: 'center',
	},
	confirmButtonText: {
		color: '#fff',
		fontSize: fontRelateSize(14),
	},

	modalContents: {
		height: heightRelateSize(96),
		marginBottom: marginRelateSize(8),
		alignItems: 'center',
		textAlign: 'center',
	},

	congrateText: {
		width: widthRelateSize(256),
		height: heightRelateSize(62),
		fontSize: fontRelateSize(18),
		marginTop: heightRelateSize(32),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#616d82',
		alignItems: 'center',
		marginBottom: marginRelateSize(8),
	},

	modalButton: {
		width: widthRelateSize(256),
		height: heightRelateSize(44),
		alignItems: 'center',
		textAlign: 'center',
		// border
	},
	modalBtn: {
		width: widthRelateSize(256),
		height: '100%',
		borderRadius: 14,
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#ffffff',
		alignItems: 'center',
		backgroundColor: '#6491ff',
		textAlign: 'center',
		justifyContent: 'center',
	},
	textStyle2: {
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#ffffff',
	},

	followModalContainer: {
		width: widthRelateSize(304),
		height: heightRelateSize(204),
		borderRadius: 20,
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
	},

	followModalContent: {
		width: widthRelateSize(256),
		height: heightRelateSize(86),
		marginTop: heightRelateSize(32),
		flexDirection: 'column',
		alignContent: 'center',
	},
	followModalImg: {
		width: widthRelateSize(DeviceInfoUtil.isTablet() ? 58 : 48),
		height: heightRelateSize(DeviceInfoUtil.isTablet() ? 58 : 48),
		marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 113 : 103),
		marginRight: widthRelateSize(105),
		marginBottom: heightRelateSize(16),
	},
	followModalTitle: {
		width: widthRelateSize(256),
		height: heightRelateSize(22),
		fontSize: fontRelateSize(13),
		marginTop: heightRelateSize(2),
		marginBottom: heightRelateSize(3),
		fontWeight: 'normal',
		fontStyle: 'normal',
		textAlign: 'center',
		lineHeight: heightRelateSize(22),
		letterSpacing: 0,
		color: '#616d82',
	},
	followModalTitle2: {
		width: widthRelateSize(256),
		height: heightRelateSize(22),
		fontSize: fontRelateSize(14),
		marginBottom: heightRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		textAlign: 'center',
		lineHeight: heightRelateSize(22),
		letterSpacing: 0,
		color: '#616d82',
	},
	followModalBtnContent: {
		width: widthRelateSize(304),
		height: heightRelateSize(64),
		flex: 1,
		flexDirection: 'row',
		marginTop: heightRelateSize(20),
	},

	followModalBtnContentSum: {
		width: widthRelateSize(304),
		height: heightRelateSize(64),
		flex: 1,
		flexDirection: 'row',
		marginTop: heightRelateSize(10),
		// backgroundColor: "red"
	},

	followModalBtnFrame: {
		width: widthRelateSize(152),
		height: heightRelateSize(64),
	},

	followModalBtnFrameSum: {
		width: widthRelateSize(304),
		height: heightRelateSize(64),
		justifyContent: 'center',
		alignItems: 'center',
	},
	followModalBtnText: {
		width: widthRelateSize(94),
		height: heightRelateSize(16),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		alignContent: 'center',
		justifyContent: 'center',
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
		marginLeft: widthRelateSize(50),
	},
	followModalBtnTextSum: {
		width: widthRelateSize(256),
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
		marginBottom: heightRelateSize(15),
	},

	followModalBtnContent1: {
		flexDirection: 'row',
		width: widthRelateSize(304),
		height: heightRelateSize(44),
		marginTop: heightRelateSize(50),
		// backgroundColor: "red"
	},

	followModalBtnContentSum1: {
		width: widthRelateSize(304),
		height: heightRelateSize(64),
		flex: 1,
		flexDirection: 'row',
		marginTop: heightRelateSize(20),
	},

	followModalBtnText1: {
		width: widthRelateSize(94),
		height: heightRelateSize(18),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		alignContent: 'center',
		justifyContent: 'center',
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#6491ff',
		marginLeft: widthRelateSize(50),
	},
	followModalBtnTextSum1: {
		width: widthRelateSize(256),
		height: heightRelateSize(18),
		fontSize: fontRelateSize(14),
		marginLeft: widthRelateSize(25),
		marginTop: heightRelateSize(30),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'center',
		color: '#6491ff',
	},
	followModalBtnFrame1: {
		width: widthRelateSize(152),
		height: heightRelateSize(64),
	},

	followModalBtnFrameSum1: {
		width: widthRelateSize(304),
		height: heightRelateSize(64),
	},

	keyImage: {
		height: 48,
		width: 48,
	},

	okImage: {
		height: 78,
		width: 78,
	},
});

export default styles;
