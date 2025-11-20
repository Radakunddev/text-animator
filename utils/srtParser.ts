import { Subtitle } from '../types';

const timeToSeconds = (timeString: string): number => {
  // Format: 00:00:01,000
  const [time, milliseconds] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const ms = milliseconds ? Number(milliseconds) : 0;
  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
};

export const parseSRT = (srtContent: string): Subtitle[] => {
  // Normalize line endings
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split('\n\n');
  
  const subtitles: Subtitle[] = [];

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return;

    // First line is ID (sometimes omitted in loose formats, but standard has it)
    // Second line is timestamp
    // Rest is text
    
    let timeLineIndex = 1;
    // Check if first line is numeric ID
    if (!/^\d+$/.test(lines[0])) {
      // Sometimes SRTs are malformed and miss the ID
      if (lines[0].includes('-->')) {
        timeLineIndex = 0;
      } else {
        return; // Skip garbage
      }
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine.includes('-->')) return;

    const [startStr, endStr] = timeLine.split(' --> ');
    const startTime = timeToSeconds(startStr.trim());
    const endTime = timeToSeconds(endStr.trim());

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.join('\n').replace(/<[^>]*>/g, ''); // Remove existing HTML tags if any

    subtitles.push({
      id: lines[0],
      startTime,
      endTime,
      text,
    });
  });

  return subtitles;
};