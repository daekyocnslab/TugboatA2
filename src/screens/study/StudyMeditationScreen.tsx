import { CommonText } from '../../components/text/Test';
import { useTimer } from '../../common/hook/Timer';
import DementionUtils from '../../common/utils/DementionUtils';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Modal,
	Platform,
	SafeAreaView,
	Image,
	TouchableOpacity,
	Pressable,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { fontRelateSize } from '../../../../tugboat-mobile/src/common/utils/DementionUtils';

const { heightRelateSize } = DementionUtils;

const StudyMeditationScreen = ({ navigation, route }) => {
	const doSq = route?.params?.doSq;
	const isContinue = route?.params?.isContinue;
	const stdySec = route?.params?.stdySec;
	const planNm = route?.params?.planNm;

	const ANIMATION_DURATION = 40000;
	const [firstModalVisible, setFirstModalVisible] = useState(false);

	const [startTimer, startTimeRemain, stopTimeRemain] = useTimer(ANIMATION_DURATION, false);
	const isFocused = useIsFocused();

	const lottieRef = useRef<LottieView>(null);
	const [lottieKey, setLottieKey] = useState(0);

	useEffect(() => {
		if (isFocused) {
			startTimeRemain();
			setFirstModalVisible(true);
			setLottieKey((k) => k + 1);
		} else {
			// 화면 이탈 시 cleanup
			stopTimeRemain();
			setFirstModalVisible(false);
			lottieRef.current?.reset();
		}
	}, [isFocused]);

	useEffect(() => {
		if (firstModalVisible && isFocused) {
			// Ensure the view is mounted before controlling playback
			requestAnimationFrame(() => {
				lottieRef.current?.reset();
				// Some platforms need explicit frame range to restart
				try {
					// play from start
					(lottieRef.current as any)?.play?.(0, 9999);
				} catch {
					lottieRef.current?.play?.();
				}
			});
		}
	}, [firstModalVisible, isFocused]);

	useEffect(() => {
		console.log('startTimer', startTimer);
		if (startTimer === '00:00') {
			setFirstModalVisible(false);
			// navigation.reset({ routes: [{ name: 'REPORT' }] });
			navigation.replace('STUDY', { planNm: planNm, doSq, isContinue: isContinue, stdySec });
			// navigation.replace('studyReady', {
			// 	doSq: 0,
			// 	isContinue: false,
			// 	stdySec: 0,
			// });
		}
	}, [startTimer, navigation]);

	/**
	 * 버튼 클릭 핸들러
	 */
	const onPressCloseorStudy = useCallback(() => {
		setFirstModalVisible(false);
		stopTimeRemain();
		// navigation.reset({ routes: [{ name: 'REPORT' }] });
		navigation.replace('STUDY', { planNm: planNm, doSq, isContinue: isContinue, stdySec });
		// navigation.replace('studyReady', {
		// 	doSq: 0,
		// 	isContinue: false,
		// 	stdySec: 0,
		// });
	}, [navigation, stopTimeRemain]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#181b24' }}>
			<Modal visible={firstModalVisible} animationType='fade'>
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: '#17191C',
					}}>
					<View
						style={{
							position: 'absolute',
							top: 50,
							left: 50,
							right: 50,
							bottom: 50,
							zIndex: 3,
						}}>
						<View
							style={{
								width: '100%',
								height: '100%',
								backgroundColor: 'rgba(46, 49, 56, 0.3)',
								position: 'absolute',
								borderRadius: 25,
								zIndex: 4,
							}}
						/>
						<Text
							style={{
								marginTop: 16,
								alignSelf: 'center',
								paddingTop: 50,
								fontSize: 24,
								color: '#FFF',
								fontWeight: 'bold',
							}}>
							{'6383 호흡법'}
						</Text>
						{/* <Pressable style={{ position: 'absolute', top: 40, right: 16, zIndex: 5 }} onPress={onPressCloseorStudy}>
							<Image
								source={require('../../../assets/images/icons/ic_l_close_gray_28.png')}
								style={{
									height: DementionUtils.widthRelateSize(24),
									width: DementionUtils.widthRelateSize(24),
								}}
								resizeMode='contain'
							/>
						</Pressable> */}
						<LottieView
							ref={lottieRef}
							key={lottieKey}
							source={require('../../../assets/images/lottie/250123_animation_6383_d.json')}
							autoPlay
							loop={false}
							style={{
								width: '100%',
								height: heightRelateSize(540),
								position: 'absolute',
								top: heightRelateSize(20),
								zIndex: -1,
							}}
						/>
					</View>
				</View>
				<View
					style={{
						position: 'absolute',
						bottom: 60,
						width: '100%',
						padding: 20,
						alignItems: 'center',
					}}>
					<TouchableOpacity
						style={{
							width: 360,
							height: 64,
							borderRadius: 12,
							backgroundColor: '#6491ff',
							justifyContent: 'center',
							alignItems: 'center',
							zIndex: 9999
						}}
						onPress={onPressCloseorStudy}>
						<Text
							style={{
								fontSize: fontRelateSize(15),
								fontWeight: '700',
								color: '#fff',
								textAlign: 'center',
								justifyContent: "center",
								alignContent: "center"
							}}>
							{'바로 공부 시작하기'}
						</Text>
					</TouchableOpacity>
				</View>
			</Modal>

			<View />
		</SafeAreaView>
	);
};

export default StudyMeditationScreen;
