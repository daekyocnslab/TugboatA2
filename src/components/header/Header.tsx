import { useNavigation } from '@react-navigation/native';
import { Image, Platform, Text, TouchableOpacity } from 'react-native';
import { View } from 'react-native-animatable';
import { CommonType } from 'types/common/CommonType';
import DementionUtils from 'common/utils/DementionUtils';
import { CommonText } from 'components/text/Test';

const {
	heightRelateSize,
	widthRelateSize,
	marginRelateSize,
	fontRelateSize,
	iOSOnlyRelateSize,
} = DementionUtils;

/**
 *
 * @param title 타이틀
 * @param back 뒤로가기 버튼 true면 뒤로가기 버튼 생성
 * @param close 닫기 버튼 false면 닫기 버튼 생성
 * @returns
 * @description 공통 헤더 컴포넌트 style은 추후 수정 부탁드립니다.
 * @example <Header title='타이틀' back close border login/>
 */
const Header = ({
	title,
	back,
	close,
	border,
	login,
	setting,
	juchaText,
	onPressClose,
	backTo,
	closeIcon,
}: {
	title: string;
	back?: boolean;
	close?: boolean;
	border?: boolean;
	login?: boolean;
	setting?: boolean;
	juchaText?: string;
	backTo?: keyof CommonType.RootStackPageList;
	onPressClose?: () => void;
	closeIcon?: string;
}) => {
	const { navigate, goBack, popToTop } =
		useNavigation<CommonType.CommonProps['navigation']>();
	return (
		<View
			style={{
				width: '100%',
				alignItems: 'center',
				justifyContent: 'space-between',
				flexDirection: 'row',
				height: heightRelateSize(56),
				paddingLeft: widthRelateSize(16),
				paddingRight: widthRelateSize(16),
				marginTop: Platform.OS === 'ios' ? 36 : 0,
				// borderWidth: border ? 1 : 0,
				borderBottomWidth: border ? 1 : 0,
				borderColor: '#e6e9f0',
			}}>
			{back ? (
				<TouchableOpacity
					style={{
						width: heightRelateSize(48),
						height: heightRelateSize(48),
						justifyContent: 'center',
					}}
					onPress={backTo ? () => navigate(backTo as never) : () => goBack()}>
					<Image
						source={require('../../../../assets/images/icons/ic_l_back_gray_24.png')}
						style={{ width: heightRelateSize(24), height: heightRelateSize(24) }}
						resizeMode='cover'
					/>
				</TouchableOpacity>
			) : (
				<View
					style={{ width: heightRelateSize(48), height: heightRelateSize(48) }}
				/>
			)}
			<View style={{ height: heightRelateSize(48), justifyContent: 'center' }}>
				{/* <Text
					style={{
						fontFamily: 'NanumBarunGothic',
						fontSize: fontRelateSize(16),
						color: '#3f4855',
						fontWeight: 'bold',
						fontStyle: 'normal',
						letterSpacing: 0,
					}}>
					{title}
				</Text> */}
				{juchaText ? (
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<CommonText bold size={16} color='#3f4855' text={title} />
						<View
							style={{
								height: 24,
								paddingHorizontal: widthRelateSize(8),
								backgroundColor: '#6491ff',
								borderRadius: 6,
								justifyContent: 'center',
								alignItems: 'center',
								marginLeft: 8,
							}}>
							<CommonText bold size={12} color='#fff' text={juchaText} />
						</View>
					</View>
				) : (
					<CommonText bold size={16} color='#3f4855' text={title} />
				)}
			</View>
			{close && (
				<TouchableOpacity
					style={{
						width: heightRelateSize(48),
						height: heightRelateSize(48),
						alignItems: 'flex-end',
						justifyContent: 'center',
					}}
					// onPress={() => popToTop()}>
					onPress={
						onPressClose
							? onPressClose
							: login
							? () => navigate('login')
							: () => popToTop()
					}>
					<Image
						source={
							closeIcon
								? closeIcon
								: require('../../../../assets/images/icons/ic_l_close_gray_24.png')
						}
						style={{
							width: heightRelateSize(24),
							height: heightRelateSize(24),
						}}
						resizeMode='cover'
					/>
				</TouchableOpacity>
			)}
			{setting && (
				<TouchableOpacity
					style={{
						width: heightRelateSize(48),
						height: heightRelateSize(48),
						alignItems: 'flex-end',
						justifyContent: 'center',
					}}
					onPress={() => navigate('settingScreen')}>
					<Image
						source={require('../../../../assets/images/icons/ic_l_setting_gray_24.png')}
						style={{
							width: heightRelateSize(24),
							height: heightRelateSize(24),
						}}
						resizeMode='cover'
					/>
				</TouchableOpacity>
			)}

			{!setting && !close && (
				<View
					style={{ width: heightRelateSize(48), height: heightRelateSize(48) }}
				/>
			)}
		</View>
	);
};

export default Header;
