import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Alert, AlertDescription } from './components/ui/alert';

const WhistGameLobby = () => {
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('Connecting...');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/test`)
      .then(response => response.json())
      .then(data => setServerStatus(`${data.message} (Games: ${data.gamesCount})`))
      .catch(error => setServerStatus('Error connecting to server'));
  }, []);

  useEffect(() => {
    if (isNameSet) {
      console.log('Connecting to server...');
      const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
        query: { playerName }
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setServerStatus('Connected to server');
      });

      newSocket.on('gameListUpdate', (updatedGames) => {
        console.log('Received game list update:', updatedGames);
        setGames(updatedGames);
      });

      newSocket.on('gameCreated', (game) => {
        console.log('Game created:', game);
        setCurrentGame(game);
      });

      newSocket.on('playerJoined', (game) => {
        console.log('Player joined:', game);
        setCurrentGame(game);
      });

      newSocket.on('playerLeft', (game) => {
        console.log('Player left:', game);
        setCurrentGame(game);
      });

      newSocket.on('gameReady', (game) => {
        console.log('Game ready to start:', game);
        setCurrentGame(game);
      });

      newSocket.on('joinError', (errorMessage) => {
        console.error('Join error:', errorMessage);
        setError(errorMessage);
      });

      return () => newSocket.close();
    }
  }, [isNameSet, playerName]);

  const handleSetName = () => {
    if (playerName.trim() === '') {
      setError('Please enter a valid name');
      return;
    }
    setIsNameSet(true);
    setError('');
  };

  const handleCreateGame = () => {
    if (newGameName.trim() === '') {
      setError('Please enter a game name');
      return;
    }
    console.log('Creating game:', newGameName);
    socket.emit('createGame', newGameName);
    setNewGameName('');
    setError('');
  };

  const handleJoinGame = (gameId) => {
    console.log('Attempting to join game:', gameId);
    socket.emit('joinGame', gameId);
  };

  const handleLeaveGame = () => {
    if (currentGame) {
      console.log('Leaving game:', currentGame.id);
      socket.emit('leaveGame', currentGame.id);
      setCurrentGame(null);
    }
  };

  const renderLobby = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            type="text" 
            placeholder="Game name" 
            value={newGameName} 
            onChange={(e) => setNewGameName(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleCreateGame}>Create Game</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open Games</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p>No open games available. Why not create one?</p>
          ) : (
            <ul>
              {games.map((game) => (
                <li key={game.id} className="mb-2 p-2 border rounded">
                  {game.name} ({game.players}/{game.maxPlayers} players)
                  <Button 
                    onClick={() => handleJoinGame(game.id)} 
                    className="ml-2"
                    disabled={game.players === game.maxPlayers}
                  >
                    Join
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderWaitingRoom = () => (
    <Card>
      <CardHeader>
        <CardTitle>{currentGame.name} - Waiting Room</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Players: {currentGame.players.map(p => p.name).join(', ')}</p>
        <p>{currentGame.players.length}/{currentGame.maxPlayers} players joined</p>
        {currentGame.players.length === currentGame.maxPlayers && (
          <p>Game is ready to start!</p>
        )}
        <Button onClick={handleLeaveGame} className="mt-2">Leave Game</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Whist Game Lobby</h1>
      
      <Alert className="mb-4">
        <AlertDescription>Server Status: {serverStatus}</AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!isNameSet ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              type="text" 
              placeholder="Your name" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Button className="mt-2" onClick={handleSetName}>
              Set Name
            </Button>
          </CardContent>
        </Card>
      ) : (
        currentGame ? renderWaitingRoom() : renderLobby()
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <WhistGameLobby />
    </div>
  );
}

export default App;