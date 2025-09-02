import React from 'react';
import { Image, Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';

const LoadingModal = ({ onPress }: { onPress: () => void }) => {
	return (
		<Modal
			animationType='fade'
			transparent={true}
			visible={true}
			onRequestClose={() => {
				// Handle modal close
			}}>
			<Pressable
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#17191C',
					paddingBottom: 200,
				}}
				onPress={onPress}>
				<Image
					source={require('../../../assets/images/icons/loadingTugboat.png')}
					style={{
						height: 214,
						width: 218,
					}}
					resizeMode='contain'
				/>
				<Text
					style={{
						color: 'rgba(255, 255, 255, 1)',
						textAlign: 'center',
						lineHeight: 36,
						fontSize: 24,
					}}>{`AI가 오늘 공부한 걸 정리하고있어요~\n잠깐만 기다려요!`}</Text>
				<View />
			</Pressable>
		</Modal>
	);
};

export default LoadingModal;
