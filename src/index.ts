// alt1 base libs, provides all the commonly used methods for image matching and capture
// also gives your editor info about the window.alt1 api
import * as a1lib from 'alt1';
import * as sauce from './a1sauce';

// tell webpack that this file relies index.html, appconfig.json and icon.png, this makes webpack
// add these files to the output directory
// this works because in /webpack.config.js we told webpack to treat all html, json and imageimports
// as assets
import './index.html';
import './appconfig.json';
import './icon.png';
import './css/styles.css';


function getByID(id: string) {
	return document.getElementById(id);
}

let helperItems = {
	Output: getByID('output'),
	settings: getByID('Settings'),
};

var progressBars = a1lib.webpackImages({
	heat_bar: require('./asset/data/heat_bar.data.png'),
});

let spokeRecently = false;

function ttsSpeak() {
	console.log('Progress alert!');
	var ttsAlarm = new SpeechSynthesisUtterance();
	ttsAlarm.text = 'Switch hammers';
	ttsAlarm.volume = played_audio.volume;
	window.speechSynthesis.cancel();
	if (!spokeRecently) {
		window.speechSynthesis.speak(ttsAlarm);
		spokeRecently = true;
		setTimeout(() => {
			spokeRecently = false;
		}, 10000);
	}
	if (spokeRecently && alt1.rsActive) {
		window.speechSynthesis.pause();
		window.speechSynthesis.cancel();
	}
}


let lastKnownHeatBarposition;
let lastKnownProgressBarPosition;

function tryFindProgressBar() {
	let client_screen = a1lib.captureHoldFullRs();

	let startOfBar = {
		progressBar: client_screen.findSubimage(progressBars.heat_bar),
	};

	if (startOfBar.progressBar[0]) {
		let heatBarposition = {
			x: startOfBar.progressBar[0].x,
			y: startOfBar.progressBar[0].y,
		};
		let progressBarPosition = {
			x: startOfBar.progressBar[0].x,
			y: startOfBar.progressBar[0].y - 2,
		};
		console.log(heatBarposition);
		lastKnownHeatBarposition = heatBarposition;
		lastKnownProgressBarPosition = progressBarPosition;
	}

	let progressBar = a1lib
		.captureHold(
			lastKnownProgressBarPosition.x - 3,
			lastKnownProgressBarPosition.y - 5,
			56,
			4
		)
		.read();
		alt1.overLaySetGroup('ProgressBar');
		alt1.overLayRect(
			a1lib.mixColor(255, 255, 255),
			lastKnownProgressBarPosition.x - 3,
			lastKnownProgressBarPosition.y - 5,
			56,
			4,
			3000,
			1
		);
		alt1.overLayRefreshGroup('ProgerssBar');
	console.log(progressBar.getPixel(44, 2));
	if (progressBar.getPixel(44, 2)[0] == 147) {
		ttsSpeak();
	}
	return
}

function checkFocusWindow() {
	if(alt1.rsActive) {
		window.speechSynthesis.pause();
		window.speechSynthesis.cancel();
		spokeRecently = true;
	}
}

let played_audio = {
	volume: 100,
}

export function startApp() {
	if (!window.alt1) {
		helperItems.Output.insertAdjacentHTML(
			'beforeend',
			`<div>You need to run this page in alt1 to capture the screen</div>`
		);
		return;
	}
	if (!alt1.permissionPixel) {
		helperItems.Output.insertAdjacentHTML(
			'beforeend',
			`<div><p>Page is not installed as app or capture permission is not enabled</p></div>`
		);
		return;
	}
	if (!alt1.permissionOverlay) {
		helperItems.Output.insertAdjacentHTML(
			'beforeend',
			`<div><p>Attempted to use Overlay but app overlay permission is not enabled. Please enable "Show Overlay" permission in Alt1 settinsg (wrench icon in corner).</p></div>`
		);
		return;
	}

	setInterval(tryFindProgressBar, 1000);
	setInterval(checkFocusWindow, 500);
}

const settingsObject = {
	settingsHeader: sauce.createHeading('h2', 'Settings'),
	volume: sauce.createRangeSetting('volume', 'Volume', {
		defaultValue: 100,
		min: 0,
		max: 100,
		unit: '%',
	}),
};

settingsObject.volume.querySelector('input').addEventListener('change', (e) => {
	played_audio.volume = parseInt(settingsObject.volume.querySelector('input').value, 10) / 100;
});

window.onload = function () {
	//check if we are running inside alt1 by checking if the alt1 global exists
	if (window.alt1) {
		//tell alt1 about the app
		//this makes alt1 show the add app button when running inside the embedded browser
		//also updates app settings if they are changed

		alt1.identifyAppUrl('./appconfig.json');
		Object.values(settingsObject).forEach((val) => {
			helperItems.settings.before(val);
		});
		played_audio.volume = parseInt(
			settingsObject.volume.querySelector('input').value,
			10
		) / 100;
		startApp();
	} else {
		let addappurl = `alt1://addapp/${
			new URL('./appconfig.json', document.location.href).href
		}`;
		helperItems.Output.insertAdjacentHTML(
			'beforeend',
			`
			Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1
		`
		);
	}
};
