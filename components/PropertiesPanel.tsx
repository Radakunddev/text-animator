import React from 'react';
import { Subtitle } from '../types';

interface PropertiesPanelProps {
    subtitles: Subtitle[];
    selectedSubtitleIds: string[];
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ subtitles, selectedSubtitleIds }) => {
    const selectedSubtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);

    if (!selectedSubtitle) {
        return (
            <div className="p-4 bg-gray-900 text-white">
                <h3 className="text-lg font-bold mb-4">Properties</h3>
                <p className="text-sm text-gray-400">Select a subtitle to see its properties.</p>
            </div>
        );
    }

    const { x = 0, y = 0, scale = 1 } = selectedSubtitle;

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h3 className="text-lg font-bold mb-4">Properties</h3>
            <div>
                <p>X: {x.toFixed(2)}</p>
                <p>Y: {y.toFixed(2)}</p>
                <p>Scale: {scale.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default PropertiesPanel;
