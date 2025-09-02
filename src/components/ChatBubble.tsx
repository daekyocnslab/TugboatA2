import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const ChatBubble = ({ message }) => (
	<View style={styles.container}>
		{/* 삼각형 꼬리 */}
		<Svg width={15} height={20} style={styles.tail}>
			<Polygon points='15,10 0,0 0,20' fill='#2D364A' />
		</Svg>

		{/* 말풍선 본체 */}
		<View style={styles.bubble}>
			<Text style={styles.text}>{message}</Text>
		</View>
	</View>
);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	tail: {
		marginTop: 70,
		marginRight: -1,
		transform: [{ rotate: '180deg' }],
	},
	bubble: {
		backgroundColor: '#2D364A',
		borderRadius: 20,
		paddingVertical: 16,
		paddingHorizontal: 18,
		// maxWidth: '89%',
		maxWidth: 520,
	},
	text: {
		color: '#B3BAC5',
		fontSize: 20,
		lineHeight: 35,
	},
});

export default ChatBubble;
