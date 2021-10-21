// Exist code line 1-80
// The store will hold all information needed globally
let store = {
	track_id: undefined,
	race_id: undefined,
	player_id: undefined,
	tracks: {},
	racers: {},
	race: {},
	real_race_id: undefined,
	raceResult: {},
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

async function onPageLoad() {
	try {
		getTracks().then((tracks) => {
			const html = renderTrackCards(tracks);
			renderAt("#tracks", html);
			store.tracks = tracks;
			// console.log(store);
		});

		getRacers().then((racers) => {
			const html = renderRacerCars(racers);
			renderAt("#racers", html);
			store.racers = racers;
			// console.log(store);
		});
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener(
		"click",
		function (event) {
			const { target } = event;

			// Race track form field
			if (target.matches(".card.track")) {
				handleSelectTrack(target);
			}

			// Podracer form field
			if (target.matches(".card.podracer")) {
				handleSelectPodRacer(target);
			}

			// Submit create race form
			if (target.matches("#submit-create-race")) {
				event.preventDefault();

				// start race
				handleCreateRace();
			}

			// Handle acceleration click
			if (target.matches("#gas-peddle")) {
				handleAccelerate(target);
			}
		},
		false
	);
}

async function delay(ms) {
	try {
		return await new Promise((resolve) => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	const selectedTrack = store.tracks.find((item) => {
		return item.id == store.track_id;
	});
	// console.log({ selectedTrack });

	// render starting UI
	renderAt("#race", renderRaceStartView(selectedTrack));

	// Get player_id and track_id from the store
	const selectedPlayerId = store.player_id;
	const selectedTrackId = selectedTrack.id;
	// invoke the API call to create the race, then save the result in variable
	const race = await createRace(selectedPlayerId, selectedTrackId);
	store.race = race;
	store.raceResult = race.Results;
	// console.log(store);

	// update the store with the race id ... this wouldn't work.. API ERROR!!! -> use realRaceID
	store.race_id = race.ID;
	// API Error!!! store.race_id NEED to be changed...!!! So Annoying
	const realRaceID = race.ID - 1;
	store.real_race_id = realRaceID;

	// The race has been created, now start the countdown
	// call the async function runCountdown
	await runCountdown();
	// call the async function startRace
	await startRace(realRaceID);
	// call the async function runRace
	store.race = await runRace(realRaceID);
}

async function runRace(raceID) {
	let runRaceInterval;
	return new Promise((resolve, reject) => {
		function updateLeaderboard(racePositions) {
			renderAt("#leaderBoard", raceProgress(racePositions));
		}
		// use Javascript's built in setInterval method to get race info every 500ms
		runRaceInterval = setInterval(async () => {
			const race = await getRace(raceID);
			//if the race info status property is "in-progress", update the leaderboard by calling:
			// console.log({ race });
			if (race.status === "in-progress") {
				updateLeaderboard(race.positions);
			}
			//if the race info status property is "finished", run the following:
			if (race.status === "finished") {
				console.log("finished");
				clearInterval(runRaceInterval); // to stop the interval from repeating
				renderAt("#race", resultsView(race.positions)); // to render the results view
				resolve(race); // resolve the promise
			}
		}, 500);
	});
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;
		let countDownInterval;

		return new Promise((resolve, reject) => {
			// run this DOM manipulation to decrement the countdown for the user
			function reduceTime() {
				timer = timer - 1; // timer--
				document.getElementById("big-numbers").innerHTML = timer;
				// use Javascript's built in setInterval method to count down once per second
				if (timer === 0) {
					clearInterval(countDownInterval);
					resolve();
				}
			}

			countDownInterval = setInterval(reduceTime, 1000);
		});
	} catch (error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id);

	// remove class selected from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");

	// save the selected racer to the store
	store.player_id = target.id;
	// console.log(store);
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id);

	// remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");

	// save the selected track id to the store
	store.track_id = target.id;
	// console.log(store);
}

function handleAccelerate() {
	console.log("accelerate button clicked");
	// Invoke the API call to accelerate
	accelerate(store.real_race_id);
}

// Exist code - HTML VIEWS ------------------------------------------------
function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join("");

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	// reasons -> 1. userPlayer undefind /2.store. player_id was passed parseInt method
	// doesn's work so removed below two lines
	// let userPlayer = positions.find((e) => e.id === store.player_id);
	// positions.id === store.player_id

	positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
	let count = 1;

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name} ${
			//p.id === store.player_id doesn't work becuase player_id was passed parseInt method
			p.id == store.player_id ? " (you)" : ""
		}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
	const node = document.querySelector(element);

	node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
	return {
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
}

async function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	try {
		const getTracks = await fetch(`${SERVER}/api/tracks`);
		const tracks = await getTracks.json();
		// console.log({ tracks });
		return tracks;
	} catch (error) {
		"something wrong to get Tracks API ", console.log(error);
	}
}

async function getRacers() {
	// GET request to `${SERVER}/api/cars`
	try {
		const getRacers = await fetch(`${SERVER}/api/cars`);
		const allRacers = await getRacers.json();
		// console.log({ allRacers });
		return allRacers;
	} catch (error) {
		"something wrong to get Racers API ", console.log(error);
	}
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return fetch(`${SERVER}/api/races`, {
		method: "POST",
		...defaultFetchOpts(),
		dataType: "jsonp",
		body: JSON.stringify(body),
	})
		.then((res) => res.json())
		.catch((err) => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	try {
		const getRaceResponse = await fetch(`${SERVER}/api/races/${id}`);
		const race = await getRaceResponse.json();
		return race;
	} catch (error) {
		"something wrong to getRace ", console.log(error);
	}
}

function startRace(id) {
	return (
		fetch(`${SERVER}/api/races/${id}/start`, {
			method: "POST",
			...defaultFetchOpts(),
		})
			// .then((res) => res.json()) // commeneted - supposed to return nothing
			.catch((err) => console.log("Problem with getRace request::", err))
	);
}

async function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	return (
		fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: "POST",
			...defaultFetchOpts(),
		})
			// .then((res) => res.json()) // commeneted - supposed to return nothing
			.catch((err) =>
				console.log("Problem with accelerate request::", err)
			)
	);

	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
}
