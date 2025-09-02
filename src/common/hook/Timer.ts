import { useEffect, useState } from 'react';

/**
 *
 * @param initialTime number
 * @param isActive  boolean
 * @example const [time ,startTimer, stopTimer] = useTimer(10000, true);
 * @description 타이머 훅
 * @returns [string, () => void]
 */
export const useTimer = (
	initialTime: number,
	isActive: boolean,
): [string, () => void, () => void] => {
	const [time, setTime] = useState(initialTime);
	const [isRunning, setIsRunning] = useState(isActive);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isRunning && time > 0) {
			interval = setInterval(() => {
				setTime((prevTime) => {
					if (prevTime <= 1000) {
						clearInterval(interval);
						setIsRunning(false);
						return 0;
					}
					return prevTime - 1000;
				});
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isRunning, time]);

	const startTimer = () => {
		setTime(initialTime);
		setIsRunning(true);
	};

	const stopTimer = () => {
		setIsRunning(false);
	};

	const minutes = Math.floor(time / 60000);
	const seconds = Math.floor((time % 60000) / 1000);
	const timeString = `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`;

	return [timeString, startTimer, stopTimer];
};
