
// API Service for backend communication using Supabase

import { Packet } from './entropyService';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

interface DetectionResult {
  timestamp: number;
  ipEntropy: number;
  sizeEntropy: number;
  isAttack: boolean;
  detectedAttack: boolean;
}

interface DetectionStats {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

// Store detection results in Supabase
export const storeDetectionResult = async (result: DetectionResult): Promise<void> => {
  try {
    // Convert timestamp to IST before storing
    const istTimestamp = formatInTimeZone(
      new Date(result.timestamp),
      'Asia/Kolkata',
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    
    const { error } = await supabase
      .from('detection_results')
      .insert({
        timestamp: istTimestamp,
        ip_entropy: result.ipEntropy,
        size_entropy: result.sizeEntropy,
        is_attack: result.isAttack,
        detected_attack: result.detectedAttack
      });
    
    if (error) {
      console.error('Error storing detection result:', error);
      throw error;
    }
    
    console.log('Detection result stored in Supabase:', result);
  } catch (error) {
    console.error('Failed to store detection result:', error);
    throw error;
  }
};

// Store detection statistics (currently not stored in Supabase)
export const storeDetectionStats = async (stats: DetectionStats): Promise<void> => {
  // In a real app, this would save stats to a separate table
  console.log('Detection stats calculated:', stats);
  return Promise.resolve();
};

// Get detection history from Supabase
export const getDetectionHistory = async (): Promise<DetectionResult[]> => {
  try {
    const { data, error } = await supabase
      .from('detection_results')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching detection history:', error);
      throw error;
    }
    
    // Transform from database format to application format
    // When retrieving, convert to local timestamp in IST
    return (data || []).map(item => ({
      timestamp: new Date(item.timestamp).getTime(),
      ipEntropy: item.ip_entropy,
      sizeEntropy: item.size_entropy,
      isAttack: item.is_attack,
      detectedAttack: item.detected_attack
    }));
  } catch (error) {
    console.error('Failed to fetch detection history:', error);
    return [];
  }
};

// Get detection statistics
export const getDetectionStats = async (): Promise<DetectionStats> => {
  try {
    // Fetch all detection results to calculate stats
    const { data, error } = await supabase
      .from('detection_results')
      .select('is_attack, detected_attack');
    
    if (error) {
      console.error('Error fetching data for stats:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        truePositives: 0,
        falsePositives: 0,
        trueNegatives: 0,
        falseNegatives: 0
      };
    }
    
    // Calculate statistics from the data
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    data.forEach(item => {
      if (item.is_attack && item.detected_attack) truePositives++;
      else if (!item.is_attack && item.detected_attack) falsePositives++;
      else if (!item.is_attack && !item.detected_attack) trueNegatives++;
      else if (item.is_attack && !item.detected_attack) falseNegatives++;
    });
    
    const total = data.length;
    const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
    const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives
    };
  } catch (error) {
    console.error('Failed to calculate detection stats:', error);
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0
    };
  }
};

// Clear detection history
export const clearDetectionHistory = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from('detection_results')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records by using a condition that's always true
    
    if (error) {
      console.error('Error clearing detection history:', error);
      throw error;
    }
    
    console.log('Detection history cleared from Supabase');
  } catch (error) {
    console.error('Failed to clear detection history:', error);
    throw error;
  }
};

// Export a packet batch to JSON
export const exportPacketData = (packets: Packet[]): string => {
  return JSON.stringify(packets, null, 2);
};

// Import packet data from JSON
export const importPacketData = (jsonData: string): Packet[] => {
  try {
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return [];
  }
};
