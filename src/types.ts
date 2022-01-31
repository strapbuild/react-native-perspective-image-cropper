import React from 'react';
import { Animated } from 'react-native';
import type { PanResponderInstance } from 'react-native';

export interface CropResult {
	path: string;
}

export interface AnimatedCoordinates {
	bottomLeft: Animated.ValueXY;
	bottomRight: Animated.ValueXY;
	topLeft: Animated.ValueXY;
	topRight: Animated.ValueXY;
}

export interface Coordinates {
	bottomLeft: ValueXY;
	bottomRight: ValueXY;
	topLeft: ValueXY;
	topRight: ValueXY;
}

export interface CreatePanResponserArgs {
	corner: Animated.ValueXY;
	state: State;
}

export interface CropArgs {
	props: Props;
	state: State;
}

export interface GetInitialCoordinateValueArgs {
	corner: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
	props: Props;
	state: State;
}

export interface GetOverlayPositionsArgs extends AnimatedCoordinates {

}

export interface ImageCoordinatesToViewCoordinatesArgs {
	corner: ValueXY;
	state: State;
}

export interface Props {
	handlerColor?: string;
	height: number;
	overlayColor?: string;
	overlayOpacity?: number;
	overlayStrokeColor?: string;
	overlayStrokeWidth?: number;
	path: string;
	rectangleCoordinates?: Coordinates;
	updateImage: (path: string, coordinates: Coordinates) => void;
	width: number;
}

export type Ref = { crop: any };

export interface State {
	bottomLeft: Animated.ValueXY;
	bottomRight: Animated.ValueXY;
	height: number;
	moving: boolean;
	overlayPositions: string;
	setBottomLeft: StateSetter<Animated.ValueXY>;
	setBottomRight: StateSetter<Animated.ValueXY>;
	setHeight: StateSetter<number>;
	setMoving: StateSetter<boolean>;
	setOverlayPositions: StateSetter<string>;
	setTopLeft: StateSetter<Animated.ValueXY>;
	setTopRight: StateSetter<Animated.ValueXY>;
	setViewHeight: StateSetter<number>;
	setWidth: StateSetter<number>;
	topLeft: Animated.ValueXY;
	topRight: Animated.ValueXY;
	viewHeight: number;
	width: number;
}

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface UpdateOverlayStringArgs {
	state: State;
}

export interface ValueXY {
	x: number;
	y: number;
}

export interface Vars {
	panResponderBottomLeft: React.MutableRefObject<PanResponderInstance>;
	panResponderBottomRight: React.MutableRefObject<PanResponderInstance>;
	panResponderTopLeft: React.MutableRefObject<PanResponderInstance>;
	panResponderTopRight: React.MutableRefObject<PanResponderInstance>;
}

export interface ViewCoordinatesToImageCoordinatesArgs {
	corner: ValueXY;
	state: State;
}
