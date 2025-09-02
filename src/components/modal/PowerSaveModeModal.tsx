import React from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import DementionUtils from 'common/utils/DementionUtils';

const PowerSaveModeModal = ({ onPress }: { onPress: () => void }) => {
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
				}}
				onPress={onPress}>
				<Image
					source={require('../../../assets/images/icons/PowerSaveIcon.png')}
					style={{
						width: 143,
						height: 120,
					}}
					resizeMode='contain'
				/>
				<Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 40, marginTop: 32, fontWeight: 'bold' }}>
					눌러서 시작해요!
				</Text>
				<View />
			</Pressable>
		</Modal>
	);
};

export default PowerSaveModeModal;
