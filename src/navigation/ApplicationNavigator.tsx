import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import StackNavigator from './StackNavigator';

/**
 * 모든 네비게이션에 대해 일괄 메인으로 관리합니다.
 * @returns
 */
const ApplicationNavigator = () => {
	return (
		<SafeAreaProvider>
			<StatusBar translucent backgroundColor='transparent' barStyle='dark-content' />
			<NavigationContainer>
				{/* 아래의 각각 Navigation 내의 Path는 중복이 발생하면 안됩니다. */}
				<StackNavigator />
			</NavigationContainer>
		</SafeAreaProvider>
	);
};
export default ApplicationNavigator;
