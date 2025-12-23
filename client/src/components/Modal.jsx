import { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, modalType, username }) => {
  if (!isOpen) return null;
  const [stats, setStats] = useState([]);
  const [scores, setScores] = useState([]);
  const [level, setLevel] = useState(1);

  const getStats = () => {
    fetch(`http://localhost:3001/api/stats?username=${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.stats);
        setStats(data.stats);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const getScores = (targetLevel) => {
    fetch(`http://localhost:3001/api/high_scores?level=${targetLevel}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setScores(data.scores);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const formatTime = (time) => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${minutes}:${displaySeconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (modalType === 'stats') {
      getStats();
    }
    if (modalType === 'scores') {
      getScores(1);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose} // Click backdrop to close
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Content based on modalType */}
        {modalType === 'stats' && (
          <div>
            <h2>Your Stats</h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                direction: 'row',
              }}
            >
              <h3>Level</h3>
              <h3>Time</h3>
            </div>
            {stats.map((stat) => (
              <div
                key={stat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  direction: 'row',
                }}
              >
                <p>{stat.level}</p>
                <p>{formatTime(stat.score)}</p>
              </div>
            ))}
          </div>
        )}

        {modalType === 'scores' && (
          <div style={{ overflow: 'auto', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                direction: 'row',
              }}
            >
              <h2>High Scores for level {level}</h2>
              <button
                style={{ backgroundColor: 'black', color: 'white' }}
                onClick={() => {
                  setLevel(level - 1);
                  getScores(level - 1);
                }}
                disabled={level === 1}
              >
                &lt;
              </button>
              <button
                style={{ backgroundColor: 'black', color: 'white' }}
                onClick={() => {
                  setLevel(level + 1);
                  getScores(level + 1);
                }}
              >
                &gt;
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                direction: 'row',
              }}
            >
              <h3>Rank</h3>
              <h3>Player</h3>
              <h3>Time</h3>
            </div>
            {scores.map((score, index) => (
              <div
                key={score.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  direction: 'row',
                }}
              >
                <p>{index + 1}</p>
                <p>{score.username}</p>
                <p>{formatTime(score.score)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
