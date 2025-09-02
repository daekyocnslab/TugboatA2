import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Keypad = ({ onNumberPress, onClear, onSubmit }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지우기', '0', '입장'];

    return (
        <View style={styles.keypad}>
            {keys.map((key, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.key, key === '입장' && styles.submitKey]}
                    onPress={() => {
                        if (key === '지우기') onClear();
                        else if (key === '입장') onSubmit();
                        else onNumberPress(key);
                    }}>
                    <Text style={[styles.keyText, key === '입장' && styles.submitText]}>
                        {key}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    key: {
        width: '30%',
        padding: 10,
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 5,
    },
    keyText: {
        fontSize: 20,
    },
    submitKey: {
        backgroundColor: '#2196F3',
    },
    submitText: {
        color: '#FFF',
    },
});

export default Keypad;