import React, { forwardRef, useRef, useState } from 'react';
import {
	NativeModules,
	PanResponder,
	Dimensions,
	Image,
	View,
	Animated,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const CustomCrop = forwardRef((props, ref) => {
	const state = {};
	const vars = {};

	[state.viewHeight, state.setViewHeight] = useState(Dimensions.get('window').width * (props.height / props.width));
	[state.height, state.setHeight] = useState(props.height);
	[state.width, state.setwidth] = useState(props.width);
	[state.moving, state.setMoving] = useState(false);
	[state.topLeft, state.setTopLeft] = useState(getInitialCoordinateValue({ corner: 'topLeft', props, state }));
	[state.topRight, state.setTopRight] = useState(getInitialCoordinateValue({ corner: 'topRight', props, state }));
	[state.bottomLeft, state.setBottomLeft] = useState(getInitialCoordinateValue({ corner: 'bottomLeft', props, state }));
	[state.bottomRight, state.setBottomRight] = useState(getInitialCoordinateValue({ corner: 'bottomRight', props, state }));
	[state.overlayPositions, state.setOverlayPositions] = useState(getOverlayPositions({
		topLeft: { x: state.topLeft.x._value, y: state.topLeft.y._value },
		topRight: { x: state.topRight.x._value, y: state.topRight.y._value },
		bottomRight: { x: state.bottomRight.x._value, y: state.bottomRight.y._value },
		bottomLeft: { x: state.bottomLeft.x._value, y: state.bottomLeft.y._value },
	}));

	vars.panResponderTopLeft = useRef(createPanResponser({ corner: state.topLeft, state }));
	vars.panResponderTopRight = useRef(createPanResponser({ corner: state.topRight, state }));
	vars.panResponderBottomLeft = useRef(createPanResponser({ corner: state.bottomLeft, state }));
	vars.panResponderBottomRight = useRef(createPanResponser({ corner: state.bottomRight, state }));

	if (ref) {
		ref.current = {
			crop: () => crop({ props, state }),
		};
	}

	return (
		<View style={{
			flex: 1,
			alignItems: 'center',
			justifyContent: 'flex-end',
		}}>
			<View style={[
				s(props).cropContainer,
				{ height: state.viewHeight },
			]}>
				<Image
					style={[
						s(props).image,
						{ height: state.viewHeight },
					]}
					resizeMode='contain'
					source={{ uri: `file://${props.path}` }}
				/>

				<Svg
					height={state.viewHeight}
					width={Dimensions.get('window').width}
					style={{ position: 'absolute', left: 0, top: 0 }}
				>
					<AnimatedPolygon
						fill={props.overlayColor || 'blue'}
						fillOpacity={props.overlayOpacity || 0.5}
						stroke={props.overlayStrokeColor || 'blue'}
						points={state.overlayPositions}
						strokeWidth={props.overlayStrokeWidth || 3}
					/>
				</Svg>

				<Animated.View
					{...vars.panResponderTopLeft.current.panHandlers}
					style={[
						state.topLeft.getLayout(),
						s(props).handler,
					]}
				>
					<View style={[
						s(props).handlerI,
						{ left: -10, top: -10 },
					]} />
					<View style={[
						s(props).handlerRound,
						{ left: 31, top: 31 },
					]} />
				</Animated.View>
				<Animated.View
					{...vars.panResponderTopRight.current.panHandlers}
					style={[
						state.topRight.getLayout(),
						s(props).handler,
					]}
				>
					<View style={[
						s(props).handlerI,
						{ left: 10, top: -10 },
					]} />
					<View style={[
						s(props).handlerRound,
						{ right: 31, top: 31 },
					]} />
				</Animated.View>
				<Animated.View
					{...vars.panResponderBottomLeft.current.panHandlers}
					style={[
						state.bottomLeft.getLayout(),
						s(props).handler,
					]}
				>
					<View style={[
						s(props).handlerI,
						{ left: -10, top: 10 },
					]} />
					<View style={[
						s(props).handlerRound,
						{ left: 31, bottom: 31 },
					]} />
				</Animated.View>
				<Animated.View
					{...vars.panResponderBottomRight.current.panHandlers}
					style={[
						state.bottomRight.getLayout(),
						s(props).handler,
					]}
				>
					<View style={[
						s(props).handlerI,
						{ left: 10, top: 10 },
					]} />
					<View style={[
						s(props).handlerRound,
						{ right: 31, bottom: 31 },
					]} />
				</Animated.View>
			</View>
		</View>
	);
});

const getInitialCoordinateValue = ({ corner, props, state }) => {
	let defaultValues = {
		topLeft: { x: 100, y: 100 },
		topRight: { x: Dimensions.get('window').width - 100, y: 100 },
		bottomLeft: { x: 100, y: state.viewHeight - 100 },
		bottomRight: { x: Dimensions.get('window').width - 100, y: state.viewHeight - 100 },
	};

	let value = props.rectangleCoordinates ? imageCoordinatesToViewCoordinates({ corner: props.rectangleCoordinates[corner], state }) : defaultValues[corner];

	return new Animated.ValueXY(value);
}

const getOverlayPositions = ({ topLeft, topRight, bottomRight, bottomLeft }) => {
	return `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
};

const createPanResponser = ({ corner, state }) => {
	return PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderMove: Animated.event([null, { dx: corner.x, dy: corner.y }], { useNativeDriver: false }),
		onPanResponderRelease: () => {
			corner.flattenOffset();
			updateOverlayString({ state });
		},
		onPanResponderGrant: () => {
			corner.setOffset({ x: corner.x._value, y: corner.y._value });
			corner.setValue({ x: 0, y: 0 });
		},
	});
};

const crop = ({ props, state }) => {
	const coordinates = {
		topLeft: viewCoordinatesToImageCoordinates({ corner: state.topLeft, state }),
		topRight: viewCoordinatesToImageCoordinates({ corner: state.topRight, state }),
		bottomLeft: viewCoordinatesToImageCoordinates({ corner: state.bottomLeft, state }),
		bottomRight: viewCoordinatesToImageCoordinates({ corner: state.bottomRight, state }),
		height: state.height,
		width: state.width,
	};

	NativeModules.CustomCropManager.crop(coordinates, `file://${props.path}`, (error, res) => {
		if (error) {
			console.warn(error);
			return;
		}

		props.updateImage(`file://${res.path}`, coordinates);
	});
};

const updateOverlayString = ({ state }) => {
	let overlayPositions = getOverlayPositions({
		topLeft: { x: state.topLeft.x._value, y: state.topLeft.y._value },
		topRight: { x: state.topRight.x._value, y: state.topRight.y._value },
		bottomRight: { x: state.bottomRight.x._value, y: state.bottomRight.y._value },
		bottomLeft: { x: state.bottomLeft.x._value, y: state.bottomLeft.y._value },
	});

	state.setOverlayPositions(overlayPositions);
};

const imageCoordinatesToViewCoordinates = ({ corner, state }) => {
	return {
		x: (corner.x * Dimensions.get('window').width) / state.width,
		y: (corner.y * state.viewHeight) / state.height,
	};
};

const viewCoordinatesToImageCoordinates = ({ corner, state }) => {
	return {
		x: (corner.x._value / Dimensions.get('window').width) * state.width,
		y: (corner.y._value / state.viewHeight) * state.height,
	};
};

const s = (props) => ({
	handlerI: {
		borderRadius: 0,
		height: 20,
		width: 20,
		backgroundColor: props.handlerColor || 'blue',
	},
	handlerRound: {
		width: 39,
		position: 'absolute',
		height: 39,
		borderRadius: 100,
		backgroundColor: props.handlerColor || 'blue',
	},
	image: {
		width: Dimensions.get('window').width,
		position: 'absolute',
	},
	bottomButton: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'blue',
		width: 70,
		height: 70,
		borderRadius: 100,
	},
	handler: {
		height: 140,
		width: 140,
		overflow: 'visible',
		marginLeft: -70,
		marginTop: -70,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
	},
	cropContainer: {
		position: 'absolute',
		left: 0,
		width: Dimensions.get('window').width,
		top: 0,
	},
});

export { CustomCrop }
