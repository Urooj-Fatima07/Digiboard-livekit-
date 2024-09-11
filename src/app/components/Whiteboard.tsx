'use client';

import { useState, useEffect, useRef } from 'react';
import { DataPacket_Kind, Room, Participant } from 'livekit-client';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

interface WhiteboardProps {
  room: Room | null;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ room }) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lines, setLines] = useState<any[]>([]);
  const [tool, setTool] = useState<string>('brush');
  const [color, setColor] = useState<string>('#df4b26');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [history, setHistory] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Konva.Vector2d>({ x: 0, y: 0 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    if (!room) return;

    room.once('connected', () => {
      setParticipants(Object.values(room.localParticipant || {}));
    });

    room.on('dataReceived', (data, participant) => {
      const decodedData = decoder.decode(data);
      try {
        const parsedData = JSON.parse(decodedData);
        const { type, points, stroke, strokeWidth } = parsedData;

        if (type === 'drawing') {
          const newLine = {
            points,
            stroke,
            strokeWidth,
            globalCompositeOperation: tool === 'brush' ? 'source-over' : 'destination-out',
            lineCap: 'round',
            lineJoin: 'round',
          };
          setLines((prevLines) => [...prevLines, newLine]);
        } else if (type === 'clear') {
          setLines([]);
        }
      } catch (error) {
        console.error('Error parsing data:', error);
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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      setIsDrawing(true);
      const newLine = {
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: color,
        strokeWidth: lineWidth,
        globalCompositeOperation: tool === 'brush' ? 'source-over' : 'destination-out',
        lineCap: 'round',
        lineJoin: 'round',
      };
      setLines((prevLines) => [...prevLines, newLine]);

      // Send drawing data to other participants
      if (room && room.localParticipant) {
        const dataToSend = JSON.stringify({
          type: 'drawing',
          points: newLine.points,
          stroke: newLine.stroke,
          strokeWidth: newLine.strokeWidth,
        });
        const data = encoder.encode(dataToSend);
        room.localParticipant.publishData(data, DataPacket_Kind.LOSSY);
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      const updatedLines = [...lines];
      const currentLine = updatedLines[updatedLines.length - 1];
      currentLine.points = [...currentLine.points, pos.x, pos.y];
      setLines(updatedLines);

      // Send drawing data to other participants
      if (room && room.localParticipant) {
        const dataToSend = JSON.stringify({
          type: 'drawing',
          points: currentLine.points,
          stroke: currentLine.stroke,
          strokeWidth: currentLine.strokeWidth,
        });
        const data = encoder.encode(dataToSend);
        room.localParticipant.publishData(data, DataPacket_Kind.LOSSY);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    saveToHistory();
  };

  const handleClear = () => {
    if (room && room.localParticipant) {
      const clearCommand = JSON.stringify({ type: 'clear' });
      const data = encoder.encode(clearCommand);
      room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    }
    setLines([]);
    saveToHistory();
  };

  const saveToHistory = () => {
    setHistory((prevHistory) => [...prevHistory, lines]);
    setRedoStack([]);
  };

  const undo = () => {
    const lastState = history.slice(-1)[0];
    setRedoStack((prevRedoStack) => [...prevRedoStack, lines]);
    setLines(lastState || []);
    setHistory((prevHistory) => prevHistory.slice(0, -1));
  };

  const redo = () => {
    const lastRedo = redoStack.slice(-1)[0];
    setLines(lastRedo || []);
    setRedoStack((prevRedoStack) => prevRedoStack.slice(0, -1));
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.1));
  };

  const handlePan = (e: Konva.KonvaEventObject<WheelEvent>) => {
    if (stageRef.current) {
      const { x, y } = stageRef.current.getAttrs();
      setPan({ x: x - e.evt.deltaX / zoom, y: y - e.evt.deltaY / zoom });
      stageRef.current.position({ x: x - e.evt.deltaX / zoom, y: y - e.evt.deltaY / zoom });
    }
  };

  const handleSaveSession = () => {
    const sessionData = JSON.stringify({ lines });
    localStorage.setItem('whiteboardSession', sessionData);
  };  

  const handleLoadSession = () => {
    const sessionData = localStorage.getItem('whiteboardSession');
    if (sessionData) {
      const { lines } = JSON.parse(sessionData);
      setLines(lines);
    }
  };
  

  return (
    <div className="relative">
      <div className="flex max-w-screen-xl max-h-screen space-x-2 m-4">
        <button onClick={handleClear} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Clear</button>
        <button onClick={undo} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Undo</button>
        <button onClick={redo} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Redo</button>
        <button onClick={handleZoomIn} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Zoom In</button>
        <button onClick={handleZoomOut} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Zoom Out</button>
        <button onClick={handleSaveSession} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Save Session</button>
        <button onClick={handleLoadSession} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Load Session</button>
        <select
          title='select'
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="m-2"
        >
          <option value="brush">Brush</option>
          <option value="eraser">Eraser</option>
        </select>
        <input
          title='input'
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="m-2"
        />
        <label className="m-2">
          Line Width
          <input
            type="range"
            min="1"
            max="50"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="ml-2"
          />
        </label>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handlePan}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              globalCompositeOperation={line.globalCompositeOperation}
              lineCap={line.lineCap}
              lineJoin={line.lineJoin}
            />
          ))}
        </Layer>
      </Stage>
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
