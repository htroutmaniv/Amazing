import { useEffect, useRef, useState, textField } from 'react';
import { initThree } from './MazeScene.js';
import generateMaze from './MazeGenerator.js';
import Stopwatch from './components/Stopwatch.jsx';
import Modal from './components/Modal.jsx';

function App() {
  const canvasRef = useRef(null);
  const [divisions, setDivisions] = useState(5);
  const controllerRef = useRef(null);
  const stopwatchRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [started, setStarted] = useState(false);
  const [playerName, setPlayerName] = useState(''); //making some assumptions about input being valid for time's sake
  const [highestLevel, setHighestLevel] = useState(1);
  const [loggedIn, setLoggedIn] = useState(false);
  const [level, setLevel] = useState(1);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isScoresOpen, setIsScoresOpen] = useState(false);

  const handleLogin = () => {
    //console.log('username: ' + playerName);
    fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: playerName }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.user) {
          setHighestLevel(data.user.highest_level);
          console.log('highest level: ' + data.user.highest_level);
          setLoggedIn(true);
        } else {
          console.error('Error:', data.message);
        }
      })
      .catch((error) => console.error('Error:', error));
  };

  const handleStart = (selectedLevel) => {
    setLevel(selectedLevel);
    setDivisions(selectedLevel + 4);
    setLevel(selectedLevel);
    setStarted(true);
  };

  useEffect(() => {
    const tiles = generateMaze(divisions, divisions + level);

    if (!canvasRef.current || !started) {
      return;
    }

    if (controllerRef.current && controllerRef.current.dispose) {
      controllerRef.current.dispose();
    }

    const onWin = () => {
      const time = stopwatchRef.current.getCurrentTime();
      console.log('time: ' + time);
      setRunning(false);
      setDivisions((prev) => prev + 1);
      setLevel((prev) => prev + 1);

      //update user highest_level on backend
      fetch('http://localhost:3001/api/level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ highestLevel: level + 1, username: playerName }),
      })
        .then((response) => response.json())
        .catch((error) => console.error('Error:', error));

      //update user score for the current level with their completion time if lower than previous

      fetch('http://localhost:3001/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: level,
          username: playerName,
          score: time,
        }),
      })
        .then((response) => response.json())
        .catch((error) => console.error('Error:', error));

      setRunning(true);
    };

    controllerRef.current = initThree(
      canvasRef.current,
      tiles,
      divisions,
      onWin
    );
  }, [divisions][started]);

  //login screen
  if (!loggedIn) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <h1>Welcome to A-Mazing!</h1>
        </div>

        <form
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            color: 'white',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h3>Enter your name to get lost</h3>
          <input
            style={{ lineHeight: 2.4 }}
            type='text'
            name='playerNameInput'
            placeholder='Enter Player Name'
            onChange={(e) => setPlayerName(e.target.value)}
            autoComplete='off'
          />
          <button
            type='button'
            style={{ marginLeft: '5px' }}
            onClick={() => handleLogin()}
          >
            confirm
          </button>
        </form>
      </div>
    );
  }

  //level selection screen
  if (!started) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ color: 'white', marginBottom: '20px' }}>
          Level Selection
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            maxWidth: '350px',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: highestLevel }, (_, i) => i + 1).map(
            (selectedLevel) => (
              <button
                key={selectedLevel}
                type='button'
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => handleStart(selectedLevel)}
              >
                {selectedLevel}
              </button>
            )
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            position: 'absolute',
            bottom: '6%',
            right: '2%',
            flexDirection: 'column',
          }}
        >
          <button
            style={{
              width: '160px',
            }}
            onClick={() => setIsStatsOpen(true)}
          >
            Stats
          </button>
          <button
            style={{
              width: '160px',
            }}
            onClick={() => setIsScoresOpen(true)}
          >
            high scores
          </button>
        </div>

        <Modal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          modalType='stats'
          username={playerName}
        />
        <Modal
          isOpen={isScoresOpen}
          onClose={() => setIsScoresOpen(false)}
          modalType='scores'
          username={playerName}
        />
      </div>
    );
  }

  //game screen
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2%',
          left: '2%',
          color: 'white',
        }}
      >
        <h1>Level: {level}</h1>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '2%',
          left: '25%',
          color: 'white',
        }}
      >
        <h1>Player: {playerName}</h1>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '2%',
          color: 'white',
        }}
      >
        <Stopwatch
          running={running}
          resetSignal={divisions}
          ref={stopwatchRef}
        />
      </div>

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          color: 'black',
        }}
      ></div>
    </div>
  );
}

export default App;
