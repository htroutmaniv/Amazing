import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

//create user or return user if they already exist
app.post('/api/users', (req, res) => {
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [req.body.username],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: 'error retrieving user from db',
          error: err.message,
        });
      }
      if (row) {
        return res
          .status(200)
          .json({ message: 'user already exists', user: row });
      } else {
        db.run(
          'INSERT INTO users (username) VALUES (?)',
          [req.body.username],
          function (err) {
            if (err) {
              return res.status(500).json({
                message: 'error inserting user into db',
                error: err.message,
              });
            }
            return res.status(201).json({
              message: 'user created',
              user: {
                username: req.body.username,
                highest_level: 1,
              },
            });
          }
        );
      }
    }
  );
});
//update user highest level
app.post('/api/level', (req, res) => {
  db.get(
    'Select highest_level FROM users WHERE username = ?',
    [req.body.username],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: 'error retrieving user from db',
          error: err.message,
        });
      }
      if (row.highest_level < req.body.highestLevel) {
        db.run(
          'UPDATE users SET highest_level = ? WHERE username = ?',
          [req.body.highestLevel, req.body.username],
          function (err) {
            if (err) {
              return res.status(500).json({
                message: 'error updating user highest level',
                error: err.message,
              });
            } else {
              return res.status(200).json({
                message: 'user highest level updated',
              });
            }
          }
        );
      } else {
        return res.status(200).json({
          message: 'user highest level is already higher',
        });
      }
    }
  );
});

//update scores with user's current level score
app.post('/api/score', (req, res) => {
  db.get(
    'SELECT * FROM scores WHERE username = ? AND level = ?',
    [req.body.username, req.body.level],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: 'error retrieving scores',
          error: err.message,
        });
      }
      if (row) {
        if (row.score > req.body.score) {
          db.run(
            'UPDATE scores SET score = ? WHERE username = ? AND level = ?',
            [(req.body.score, req.body.username, req.body.level)],
            (err) => {
              if (err) {
                return res.status(500).json({
                  message: 'error updating score',
                  error: err.message,
                });
              }
              return res.status(200).json({
                message: 'score updated',
              });
            }
          );
        } else {
          return res.status(200).json({
            message: 'existing score is better',
          });
        }
      } else {
        db.run(
          'INSERT INTO scores (username, level,score) VALUES (?, ?, ?)',
          [req.body.username, req.body.level, req.body.score],
          function (err) {
            if (err) {
              return res.status(500).json({
                message: 'error inserting score into db',
                error: err.message,
              });
            }
            return res.status(201).json({
              message: 'user score logged',
            });
          }
        );
      }
    }
  );
});

//get user's stats
app.get('/api/stats', (req, res) => {
  db.all(
    'SELECT level, score FROM scores WHERE username = ? ORDER BY level ASC',
    [req.query.username],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'error retrieving user from db',
          error: err.message,
        });
      }
      return res.status(200).json({
        message: 'stats retrieved',
        stats: rows,
      });
    }
  );
});

//get high scores for a specific level
app.get('/api/high_scores', (req, res) => {
  db.all(
    'SELECT username, score FROM scores WHERE level = ? ORDER BY score ASC LIMIT 10',
    [req.query.level],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'error retrieving user from db',
          error: err.message,
        });
      }
      return res.status(200).json({
        message: 'high scores retrieved',
        scores: rows,
      });
    }
  );
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
