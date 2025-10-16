import React from 'react';
import { DesignType } from '../types';

interface DesignTypeSelectorProps {
  selectedType: DesignType | null;
  onSelectType: (type: DesignType) => void;
}

const DesignTypeSelector: React.FC<DesignTypeSelectorProps> = ({ selectedType, onSelectType }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-inner -mt-4">
      <h2 className="text-lg font-semibold text-white mb-3">What type of design is this?</h2>
      <div className="flex gap-3">
        <button
          onClick={() => onSelectType(DesignType.BOOK)}
          className={`w-full p-3 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
            selectedType === DesignType.BOOK
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Book
        </button>
        <button
          onClick={() => onSelectType(DesignType.BROCHURE)}
          className={`w-full p-3 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
            selectedType === DesignType.BROCHURE
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Brochure
        </button>
      </div>
    </div>
  );
};

export default DesignTypeSelector;
