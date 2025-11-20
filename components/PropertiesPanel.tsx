import React from 'react';
import { Subtitle } from '../types';

interface PropertiesPanelProps {
    subtitles: Subtitle[];
    selectedSubtitleIds: string[];
    onPropertyChange: (property: keyof Subtitle, value: any) => void;
}

const NumberInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400">{label}</label>
        <input
            type="number"
            value={value.toFixed(2)}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-24 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            step={0.01}
        />
    </div>
);


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ subtitles, selectedSubtitleIds, onPropertyChange }) => {
    const selectedSubtitle = subtitles.find(s => s.id === selectedSubtitleIds[0]);

    const a = 1;

    if (selectedSubtitleIds.length === 0 || !selectedSubtitle) {
        return (
            <div className="p-4 bg-gray-900 text-white border-t border-gray-800">
                <h3 className="text-sm font-bold mb-2 text-gray-400 uppercase tracking-wider">Properties</h3>
                <p className="text-xs text-gray-500">Select a subtitle to see its properties.</p>
            </div>
        );
    }
    
    // If multiple items are selected, show an indicator or average values?
    // For now, we'll just show the values of the FIRST selected item.
    const { x = 0, y = 0, scale = 1 } = selectedSubtitle;

    return (
        <div className="p-4 bg-gray-900 text-white border-t border-gray-800 flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-wider">
                {selectedSubtitleIds.length > 1 ? `Properties (${selectedSubtitleIds.length} items)` : `Properties`}
            </h3>
            <div className="space-y-3">
                <NumberInput label="Position X" value={x} onChange={(val) => onPropertyChange('x', val)} />
                <NumberInput label="Position Y" value={y} onChange={(val) => onPropertyChange('y', val)} />
                <NumberInput label="Scale" value={scale} onChange={(val) => onPropertyChange('scale', val)} />
            </div>
        </div>
    );
};

export default PropertiesPanel;
