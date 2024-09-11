'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { DataPacket_Kind, Room, Participant } from 'livekit-client';

// Define the props for the Whiteboard component
interface WhiteboardProps {
  room: Room | null;
}

// Define the state for cursor position
interface CursorPos {
  x: number;
  y: number;
}

// Define the state for the history of canvas states
interface CanvasState {
  image: string; // Data URL of the canvas state
}

// Define the state for the Whiteboard component
interface WhiteboardState {
  isDrawing: boolean;
  participants: Participant[];
  error: string | null;
  history: CanvasState[];
  redoHistory: CanvasState[];
  lineWidth: number;
  lineColor: string;
  zoom: number;
  cursorPos: CursorPos;
}

// Define the data structure for drawing commands
interface DrawingData {
  offsetX: number;
  offsetY: number;
  type: 'drawing';
  color: string;
  width: number;
}

// Define the data structure for clear canvas commands
interface ClearData {
  type: 'clear';
}

// Define the types of data that can be sent over the network
type DrawingDataPacket = DrawingData | ClearData;


interface WhiteboardProps {
  room: Room | null;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ room }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [lineColor, setLineColor] = useState<string>('black');
  const [zoom, setZoom] = useState<number>(1);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!room) {
      setError('Room is not available.');
      return;
    }

    room.once('connected', () => {
      console.log('Room connected.');

      if (room.participants && Object.keys(room.participants).length > 0) {
        setParticipants(Object.values(room.participants));
      } else {
        console.warn('No participants available yet.');
      }
    });

    room.on('dataReceived', (data, participant) => {
      console.log('Data received from participant:', participant.identity);
      const decodedData = decoder.decode(data);
      console.log('Decoded data:', decodedData);

      try {
        if (decodedData) {
          const parsedData = JSON.parse(decodedData);
          const { offsetX, offsetY, type, color, width } = parsedData;
          if (type === 'drawing') {
            drawFromRemote(offsetX, offsetY, color, width);
          } else if (type === 'clear') {
            clearCanvasRemote();
          }
        } else {
          console.warn('Received empty data from participant:', participant.identity);
        }
      } catch (error) {
        console.error('Error parsing data from participant:', participant.identity, error);
      }
    });

    room.on('participantConnected', (participant) => {
      setParticipants((prevParticipants) => [...prevParticipants, participant]);
    });

    room.on('participantDisconnected', (participant) => {
      setParticipants((prevParticipants) =>
        prevParticipants.filter((p) => p.sid !== participant.sid)
      );
    });

    return () => {
      if (room) room.disconnect();
    };
  }, [room]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.strokeStyle = lineColor;
      context.lineWidth = lineWidth;
      contextRef.current = context;
    }
  }, [lineColor, lineWidth]);

  const startDrawing = (event: MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;
    const context = contextRef.current;
    if (context) {
      context.beginPath();
      context.moveTo(offsetX / zoom, offsetY / zoom);
      setIsDrawing(true);
    }
  };

  const finishDrawing = () => {
    const context = contextRef.current;
    if (context) {
      context.closePath();
      setIsDrawing(false);
      const image = canvasRef.current?.toDataURL();
      if (image) {
        setHistory((prevHistory) => [...prevHistory, image]);
        setRedoHistory([]);
      }
    }
  };

  const draw = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    const context = contextRef.current;
    if (context) {
      context.lineTo(offsetX / zoom, offsetY / zoom);
      context.stroke();

      if (room && room.localParticipant) {
        const dataToSend = JSON.stringify({
          offsetX: offsetX / zoom,
          offsetY: offsetY / zoom,
          type: 'drawing',
          color: lineColor,
          width: lineWidth,
        });
        const data = encoder.encode(dataToSend);

        if (data && data.length > 0) {
          room.localParticipant.publishData(data, DataPacket_Kind.LOSSY);
        }
      }
    }
  };

  const drawFromRemote = (offsetX: number, offsetY: number, color: string, width: number) => {
    const context = contextRef.current;
    if (context) {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineTo(offsetX * zoom, offsetY * zoom);
      context.stroke();
    }
  };

  const clearCanvas = () => {
    if (room && room.localParticipant) {
      const clearCommand = JSON.stringify({ type: 'clear' });
      const data = encoder.encode(clearCommand);

      room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    }

    const context = contextRef.current;
    if (context) {
      context.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
    }
    setHistory([]);
    setRedoHistory([]);
  };

  const clearCanvasRemote = () => {
    const context = contextRef.current;
    if (context) {
      context.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const previousState = history.pop();
      if (previousState) {
        setRedoHistory((prevRedoHistory) => [...prevRedoHistory, canvasRef.current?.toDataURL() || '']);
        const img = new Image();
        img.src = previousState;
        img.onload = () => {
          const context = contextRef.current;
          if (context) {
            context.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
            context.drawImage(img, 0, 0);
          }
        };
        setHistory(history);
      }
    }
  };

  const redo = () => {
    if (redoHistory.length > 0) {
      const redoState = redoHistory.pop();
      if (redoState) {
        setHistory((prevHistory) => [...prevHistory, canvasRef.current?.toDataURL() || '']);
        const img = new Image();
        img.src = redoState;
        img.onload = () => {
          const context = contextRef.current;
          if (context) {
            context.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
            context.drawImage(img, 0, 0);
          }
        };
        setRedoHistory(redoHistory);
      }
    }
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom * 1.1, 3));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom / 1.1, 0.5));
  };

  return (
    <div className="relative">
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex space-x-2 m-4">
        <button onClick={undo} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Undo</button>
        <button onClick={redo} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Redo</button>
        <button onClick={clearCanvas} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Clear</button>
        <button onClick={zoomIn} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Zoom In</button>
        <button onClick={zoomOut} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Zoom Out</button>
        <input
          title='input'
          type="color"
          value={lineColor}
          onChange={(e) => setLineColor(e.target.value)}
          className="ml-2"
        />
        <label className="ml-2">
          Line Width
          <input
            type="range"
            min="1"
            max="50"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="ml-2"
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        width={800}
        height={600}
        className="border border-black"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      />
      <div
        className="absolute"
        style={{
          top: `${cursorPos.y}px`,
          left: `${cursorPos.x}px`,
          width: `${lineWidth}px`,
          height: `${lineWidth}px`,
          backgroundColor: lineColor,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
      />
      <div>
        <h3 className="text-xl font-bold">Participants</h3>
        <ul>
          {participants.map((participant) => (
            <li key={participant.sid}>{participant.identity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Whiteboard;
