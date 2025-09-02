import { StyleSheet } from 'react-native';
import DementionUtils from '../../../common/utils/DementionUtils';

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f8f9fa',
	},
	label: {
		fontSize: fontRelateSize(20),
		marginBottom: 10,
		color: '#333',
	},
	inner: {
		width: '100%',
		alignItems: 'center',
	},
	contentsWrapper: {
		flex: 1,
		flexWrap: 'wrap',
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	contents: {
		width: '100%',
		height: '40%',
		justifyContent: 'center',
		alignItems: 'center',
		padding: widthRelateSize(50),
	},
	subContents: {
		width: '100%',
		height: '60%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#B8C9D3',
		padding: widthRelateSize(50),
	},
	main: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		fontSize: fontRelateSize(24),
		fontWeight: 'bold',
		color: '#000000',
		marginBottom: marginRelateSize(10),
	},
	inputRow: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	inputBox: {
		fontSize: fontRelateSize(24),
		fontWeight: 'bold',
		marginHorizontal: widthRelateSize(8),
		color: '#333',
	},
	divider: {
		height: heightRelateSize(5),
		backgroundColor: '#D9D9D9',
		width: '100%',
		marginVertical: heightRelateSize(5),
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 20,
	},
	envLabelText: {
		fontSize: 22,
		color: '#333',
		marginBottom: 20,
	},
	input: {
		width: '100%',
		height: 50,
		fontSize: 18,
		borderBottomWidth: 3,
		borderBottomColor: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
		letterSpacing: 5,
		color: 'black',
	},
	button: {
		width: '60%', // 버튼의 너비 조정 (원하는 크기로 조정 가능)
		backgroundColor: '#6491FF', // 밝은 파란색 (이미지와 유사한 색상)
		paddingVertical: 12, // 상하 패딩 조정
		borderRadius: 30, // 둥근 모서리 반영
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000', // 그림자 추가
		shadowOffset: { width: 0, height: 2 },
		marginTop: heightRelateSize(16),
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 5, // Android 그림자 효과
	},
	buttonText: {
		color: '#ffffff', // 흰색 텍스트
		fontSize: fontRelateSize(16), // 글씨 크기 조정
		fontWeight: '600', // 볼드 효과
	},

	infoWrapper: {
		marginTop: marginRelateSize(20),
	},

	infoText: {
		textAlign: 'center',
		color: '#666',
		fontSize: fontRelateSize(14),
		marginBottom: heightRelateSize(3),
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
	title1: {
		width: widthRelateSize(264),
		height: heightRelateSize(17),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		fontWeight: 'normal',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#aab0be',
		marginBottom: heightRelateSize(8),
	},
	title2: {
		width: widthRelateSize(264),
		height: heightRelateSize(19),
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(16),
		fontWeight: 'bold',
		fontStyle: 'normal',
		letterSpacing: 0,
		textAlign: 'left',
		color: '#f0f1f2',
	},
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
		alignItems: 'center',
		justifyContent: 'space-between', // ✅ 좌우 끝으로 배치
		marginBottom: heightRelateSize(6),
	},

	permissionTitle: {
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		lineHeight: heightRelateSize(20),
		fontWeight: 'bold',
		color: '#6491ff',
	},
	permissionSwitch: { justifyContent: 'center', marginRight: widthRelateSize(30) },
	permissionContent: {
		justifyContent: 'center',
	},
	permissionContentTxt: {
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
		marginTop: heightRelateSize(12),
		marginBottom: heightRelateSize(12),
	},
	permissionAlertTxt: {
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
		// flexDirection: "row",
		alignSelf: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		marginTop: heightRelateSize(24),
		marginLeft: widthRelateSize(-20),
	},
	permissionBottonFrame: {
		zIndex: 1,
		alignSelf: 'center',
		justifyContent: 'center',
		textAlign: 'center',
	},
	permissionBottonTxt: {
		zIndex: 1,
		fontFamily: 'NanumBarunGothic',
		fontSize: fontRelateSize(14),
		fontWeight: 'bold',
		fontStyle: 'normal',
		color: '#6491ff',
	},
});

export default styles;
