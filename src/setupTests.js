// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for packages that expect them in Node
try {
	const { TextEncoder, TextDecoder } = require('util');
	if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
	if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
} catch (e) {
	// ignore if not available
}


// Global lightweight mocks for browser-only or heavy libraries used by the app
// so Jest can import modules without loading browser APIs.
jest.mock('jspdf', () => {
	return function JsPDF() {
		return { save: jest.fn(), output: jest.fn() };
	};
});

jest.mock('html2canvas', () => jest.fn(() => Promise.resolve({ toDataURL: () => '' })));

jest.mock('@react-google-maps/api', () => ({
	GoogleMap: ({ children }) => children || null,
	LoadScript: ({ children }) => children || null,
	InfoWindow: () => null,
	DirectionsRenderer: () => null,
}));

jest.mock('react-beautiful-dnd', () => ({
	DragDropContext: ({ children }) => children || null,
	Droppable: ({ children }) => children || null,
	Draggable: ({ children }) => children || null,
}));

jest.mock('react-apexcharts', () => () => null);

// Virtual mock for react-router-dom so Jest doesn't need to resolve package exports
jest.mock('react-router-dom', () => {
	const React = require('react');
	return ({
		BrowserRouter: ({ children }) => children,
		Routes: ({ children }) => children,
		Route: ({ children }) => null,
		Link: React.forwardRef(({ children, ...props }, ref) => React.createElement('a', { ref, ...props }, children)),
		useNavigate: () => () => {},
	});
}, { virtual: true });
