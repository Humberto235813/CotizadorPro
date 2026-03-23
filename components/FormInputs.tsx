// Componente de Input con Icono
import React, { InputHTMLAttributes } from 'react';

interface InputWithIconProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: React.ReactNode;
    error?: string;
    label?: string;
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
    icon,
    error,
    label,
    required,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
                <input
                    {...props}
                    className={`
            w-full pl-10 pr-3 py-2.5 
            rounded-lg border-2
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'}
            focus:ring-4 focus:outline-none
            transition-all duration-200
            ${className}
          `}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

interface TextAreaWithIconProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    icon: React.ReactNode;
    error?: string;
    label?: string;
}

export const TextAreaWithIcon: React.FC<TextAreaWithIconProps> = ({
    icon,
    error,
    label,
    required,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                    {icon}
                </div>
                <textarea
                    {...props}
                    className={`
            w-full pl-10 pr-3 py-2.5
            rounded-lg border-2
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'}
            focus:ring-4 focus:outline-none
            transition-all duration-200
            resize-none
            ${className}
          `}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};
