
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Packet } from '../services/entropyService';
import { ArrowRight } from 'lucide-react';

interface PacketVisualizerProps {
  packets: Packet[];
  isRunning: boolean;
  speed: number;
}

interface VisualPacket {
  id: number;
  top: number;
  isAttack: boolean;
  key: string;
}

const PacketVisualizer: React.FC<PacketVisualizerProps> = ({
  packets,
  isRunning,
  speed
}) => {
  const [visualPackets, setVisualPackets] = useState<VisualPacket[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const packetIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const createVisualPacket = useCallback(() => {
    if (packetIndexRef.current >= packets.length) {
      packetIndexRef.current = 0;
      return null;
    }
    
    const packet = packets[packetIndexRef.current];
    packetIndexRef.current++;
    
    if (!containerRef.current) return null;
    
    const height = containerRef.current.clientHeight;
    const top = Math.floor(Math.random() * (height - 10));
    
    return {
      id: packet.id,
      top,
      isAttack: !!packet.isAttack,
      key: `packet-${packet.id}-${Date.now()}`
    };
  }, [packets]);

  // Handle packet animation
  const animatePackets = useCallback(() => {
    if (!isRunning) return;
    
    const newPacket = createVisualPacket();
    if (newPacket) {
      setVisualPackets(prev => [...prev, newPacket]);
    }
    
    // Remove packets that have completed their animation
    setTimeout(() => {
      setVisualPackets(prev => prev.filter(p => p.key !== newPacket?.key));
    }, 3000);
    
    timerRef.current = window.setTimeout(animatePackets, 3000 / speed);
  }, [isRunning, speed, createVisualPacket]);

  useEffect(() => {
    if (isRunning) {
      animatePackets();
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, animatePackets]);

  return (
    <div className="glass-morphism rounded-lg p-4 h-[200px] relative overflow-hidden">
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Traffic Visualization</h3>
      <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
        <div>Source</div>
        <ArrowRight className="w-4 h-4" />
        <div>Target Server</div>
      </div>
      <div ref={containerRef} className="relative w-full h-[130px] border-y border-muted">
        {visualPackets.map((packet) => (
          <div
            key={packet.key}
            className={`packet ${packet.isAttack ? 'packet-attack' : 'packet-normal'} animate-packet-move`}
            style={{ top: `${packet.top}px` }}
          />
        ))}
      </div>
    </div>
  );
};

export default PacketVisualizer;
