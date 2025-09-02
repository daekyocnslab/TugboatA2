import type { StackScreenProps } from '@react-navigation/stack';
import { Paths } from './Paths';

export type RootStackParamList = {
	[Paths.HOME]: undefined;
	[Paths.TEMP_STUDY]: undefined;
	[Paths.MAIN_TAB]: undefined;
	[Paths.CENTER_INPUT]: undefined;
	[Paths.ATTENDANCE]: undefined;
	[Paths.FACE]: undefined;
	[Paths.TOUCH]: undefined;
	[Paths.LOGIN_SELECT]: undefined;

	[Paths.STUDY]: undefined;
	[Paths.STUDY_PLAN]: undefined;
	[Paths.REPORT]: undefined;
	[Paths.MEDITATION]: undefined;
};

export type RootScreenProps<S extends keyof RootStackParamList = keyof RootStackParamList> = StackScreenProps<
	RootStackParamList,
	S
>;
